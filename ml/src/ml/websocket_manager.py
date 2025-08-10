from fastapi import WebSocket
from typing import TypedDict, List, Literal, Optional
import json


class Bot(TypedDict):
    id: str
    type: Literal['auto', 'manual']
    wins: int
    losses: int
    rating: int
    status: Literal['active', 'inactive']


class Tournament(TypedDict):
    id: str
    bot: Bot
    maxParticipants: int
    participants: List[str]
    status: Literal['upcoming', 'active', 'completed']


CONNECTED_BOTS = {}
TOURNAMENTS = {}

class WebSocketManager:
    def __init__(self):
        pass

    async def connect_bot(self, websocket: WebSocket, bot_id: str):
        await websocket.accept()
        CONNECTED_BOTS[bot_id] = websocket

    async def disconnect_bot(self, bot_id: str):
        websocket = CONNECTED_BOTS.get(bot_id)
        if websocket:
            try:
                await websocket.close()
            except Exception as e:
                pass
            del CONNECTED_BOTS[bot_id]

    async def join_tournament(self, tournament: Tournament):
        print('Joining tournament:', tournament)
        participants = tournament['participants']
        maxParticipants = tournament['maxParticipants']
        botId = tournament['bot']['id']
        tournamentId = tournament['id']

        if tournamentId not in TOURNAMENTS:
            print('Tournament not found:', tournament)
            return

        if len(participants) < maxParticipants and botId not in participants:
            participants.append(botId)
            tournament['status'] = "active" if len(participants) >= maxParticipants else "upcoming"
            for bot in participants:
                await CONNECTED_BOTS[bot].send_text(json.dumps({
                    "type": "JoinTournament",
                    "tournament": tournament
                }))
        TOURNAMENTS[tournamentId] = tournament

    async def notify_tournament(self, tournament: Tournament):
        print('Notifying bots about changed tournament:', tournament)

        if tournament['id'] not in TOURNAMENTS:
            print('Tournament not found:', tournament)
            return

        for bot in CONNECTED_BOTS:
            await CONNECTED_BOTS[bot].send_text(json.dumps({
                "type": "NotifyTournament",
                "tournament": tournament
            }))

    async def create_tournament(self, tournament: Tournament):
        tournamentId = tournament['id']

        if tournamentId in TOURNAMENTS:
            return

        print('Creating new tournament:', tournament)
        TOURNAMENTS[tournamentId] = tournament

        for bot in CONNECTED_BOTS:
            await CONNECTED_BOTS[bot].send_text(json.dumps({
                "type": "CreateTournament",
                "tournament": tournament
            }))

    def debug_bots(self):
        print("Connected Bots:")
        print(CONNECTED_BOTS)

    def debug_tournaments(self):
        print("Tournaments:")
        print(TOURNAMENTS)


# Global WebSocket manager instance
manager = WebSocketManager()
