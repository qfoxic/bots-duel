from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from .websocket_manager import manager
import json


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"]
)


@app.websocket("/ws/{bot_id}")
async def websocket_endpoint(websocket: WebSocket, bot_id: str):
    await manager.connect_bot(websocket, bot_id)
    manager.debug_bots()

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            message_type = message["type"]

            if message_type == "JoinTournament":
                # TODO. Error. Bot can join multiple tournaments. Please fix. It can join only one tournament at a time.
                tournament = message["tournament"]
                await manager.join_tournament(tournament)
                await manager.notify_tournament_non_participants(tournament)
            elif message_type == "CreateTournament":
                await manager.create_tournament(message["tournament"])
            elif message_type == "TournamentMoveDone":
                await manager.tournament_move_done(message["tournament"], message["move"])
            elif message_type == "TournamentFinished":
                tournament = message["tournament"]
                # TODO. Train is a blocking operation for some reason. Please fix it. Also, we need to think on making it by request.
                await manager.tournament_finished(tournament, message["result"])
                await manager.notify_tournament_non_participants(tournament)
            elif message_type == "TournamentAskForCoord":
                await manager.tournament_ask_for_coord(message["tournament"])

    except WebSocketDisconnect:
        await manager.disconnect_bot(bot_id)
    except Exception as e:
        print(f"WebSocket error for bot {bot_id}: {e}")
        await manager.disconnect_bot(bot_id)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
