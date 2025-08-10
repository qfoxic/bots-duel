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

            message_type = message.get("type")

            if message_type == "JoinTournament":
                # TODO. Error. Bot can join multiple tournaments. Please fix. It can join only one tournament at a time.
                tournament = message.get("tournament")
                await manager.join_tournament(tournament)
                await manager.notify_tournament(tournament)
                manager.debug_tournaments()
            elif message_type == "CreateTournament":
                await manager.create_tournament(message.get("tournament"))
                manager.debug_tournaments()

    except WebSocketDisconnect:
        await manager.disconnect_bot(bot_id)
    except Exception as e:
        print(f"WebSocket error for bot {bot_id}: {e}")
        await manager.disconnect_bot(bot_id)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
