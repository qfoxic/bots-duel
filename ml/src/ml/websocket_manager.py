import os
from fastapi import WebSocket
from typing import List, Dict
import json

from .model import TrainableBot
from .data_types import Tournament, Status, Result

CONNECTED_BOTS: Dict[str, WebSocket] = {} # Map of bot_id to WebSocket connections
TOURNAMENTS: Dict[str, Tournament] = {} # Map of tournament_id to Tournament instances
AGENTS: Dict[str, TrainableBot] = {} # Map of bot_id to TrainableBot instances
MODELS_PATH = "./bots/"  # Path to save models
MAX_PARTICIPANTS = 2  # Max participants in a tournament

class WebSocketManager:
    async def connect_bot(self, websocket: WebSocket, bot_id: str):
        await websocket.accept()
        CONNECTED_BOTS[bot_id] = websocket

    async def disconnect_bot(self, bot_id: str):
        ws = CONNECTED_BOTS.get(bot_id)
        try:
            await ws.close()
        except Exception:
            pass
        del CONNECTED_BOTS[bot_id]

    async def join_tournament(self, tournament: Tournament):
        print("Joining tournament:", tournament)
        participants = tournament["participants"]
        botId = tournament["bot"]["id"]
        tournamentId = tournament["id"]

        if tournamentId not in TOURNAMENTS:
            print("Tournament not found:", tournament)
            return

        if len(participants) < MAX_PARTICIPANTS and botId not in participants:
            participants.append(botId)
            # Create a new TrainableBot instance for a tournament participant
            AGENTS[botId] = TrainableBot(tournament["dims"][0], tournament["dims"][1], tournament["bot"])
            AGENTS[botId].load(f"{os.path.join(MODELS_PATH, tournament["bot"]["id"])}.pt")
            tournament["status"] = Status.ACTIVE

            # Notify all participants but the one who joined the tournament
            for bot in participants:
                if bot == botId:
                    continue
                await CONNECTED_BOTS[bot].send_text(json.dumps({
                    "type": "JoinTournament",
                    "tournament": tournament
                }))

    async def notify_tournament_non_participants(self, tournament: Tournament):
        print("Notifying bots about changed tournament:", tournament)

        if tournament["id"] not in TOURNAMENTS:
            print("Tournament not found:", tournament)
            return

        for bot in CONNECTED_BOTS:
            # No need to notify bots that participate in the tournament
            if bot in tournament["participants"]:
                continue

            await CONNECTED_BOTS[bot].send_text(json.dumps({
                "type": "NotifyTournament",
                "tournament": tournament
            }))

    async def create_tournament(self, tournament: Tournament):
        tournamentId = tournament["id"]

        if tournamentId in TOURNAMENTS:
            return

        print("Creating new tournament:", tournament)
        TOURNAMENTS[tournamentId] = tournament
        # Create a new TrainableBot instance for a tournament owner
        AGENTS[tournament["bot"]["id"]] = TrainableBot(tournament["dims"][0], tournament["dims"][1], tournament["bot"])
        AGENTS[tournament["bot"]["id"]].load(f"{os.path.join(MODELS_PATH, tournament["bot"]["id"])}.pt")

        # Notify all connected bots but the one that created the tournament
        for bot in CONNECTED_BOTS:
            if bot == tournament["bot"]["id"]:
                continue
            await CONNECTED_BOTS[bot].send_text(json.dumps({
                "type": "CreateTournament",
                "tournament": tournament
            }))

    async def tournament_finished(self, tournament: Tournament, result: Result):
        print("=== Tournament finished:", tournament, "Result:", result)
        tournamentId = tournament["id"]
        if tournamentId not in TOURNAMENTS:
            return

        tournament["status"] = Status.COMPLETED
        TOURNAMENTS[tournamentId] = tournament
        user_bot = AGENTS[tournament["bot"]["id"]]
        print(f"Training bot {tournament["bot"]["id"]} with tournament result {result}")

        user_bot.train(result)
        user_bot.save(f"{os.path.join(MODELS_PATH, tournament["bot"]["id"])}.pt")

    async def tournament_move_done(self, tournament: Tournament, move: List[int]):
        if tournament["id"] not in TOURNAMENTS:
            print("Tournament not found:", tournament)
            return

        participants = tournament["participants"]
        for botId in participants:
            if botId not in AGENTS:
                continue
            agent = AGENTS[botId]
            agent.record_step(tournament, move)

        for bot in participants:
            await CONNECTED_BOTS[bot].send_text(json.dumps({
                "type": "TournamentMoveDone",
                "tournament": tournament,
                "move": move,
                "grid": AGENTS[bot].get_current_grid(),
                "resolution": AGENTS[bot].get_current_resolution()
            }))

    async def tournament_ask_for_coord(self, tournament: Tournament):
        if tournament["id"] not in TOURNAMENTS:
            print("Tournament not found:", tournament)
            return
        ((x, y), _, _) = AGENTS[tournament["bot"]["id"]].act(tournament, greedy=True)
        await CONNECTED_BOTS[tournament["bot"]["id"]].send_text(json.dumps({
            "type": "TournamentAskForCoord",
            "tournament": tournament,
            "coord": (x, y)
        }))

    def debug_bots(self):
        print("Connected Bots:")
        print(CONNECTED_BOTS)

    def debug_tournaments(self):
        print("Tournaments:")
        print(TOURNAMENTS)


# Global WebSocket manager instance
manager = WebSocketManager()
