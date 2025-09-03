from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from .manager import manager
import json
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    await manager.start()
    yield
    await manager.stop()


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"]
)


@app.websocket("/ws/{bot_id}")
async def ws_endpoint(ws: WebSocket, bot_id: str):
    await ws.accept()
    manager.add_client(bot_id, ws)

    async def worker_callback(msg):
        if msg["type"] == "TournamentAskForCoord":
            await manager.notify_bots(lambda bot_id: bot_id == msg["tournament"]["bot"]["id"], msg)
        if msg["type"] == "TournamentMoveDone":
            await manager.notify_bots(lambda bot_id: bot_id == msg["bot"], {k: v for k, v in msg.items() if k != "bot"})

    try:
        while True:
            msg = json.loads(await ws.receive_text())
            msg_type = msg["type"]
            if msg_type == "CreateTournament":
                tournament = msg["tournament"]
                await manager.publish_to_worker(tournament["id"], {})
                await manager.subscribe_to_worker(tournament["id"], worker_callback)
                await manager.create_tournament(tournament)
                await manager.notify_bots(lambda bot_id, owner=tournament["owner"]: bot_id != owner["id"], msg)
            elif msg_type == "JoinTournament":
                tournament = msg["tournament"]
                await manager.publish_to_worker(tournament["id"], msg)
                await manager.join_tournament(tournament)
                await manager.notify_bots(lambda bot_id, bot=tournament["bot"]: bot_id != bot["id"], msg)
            elif msg_type == "TournamentAskForCoord":
                await manager.publish_to_worker(tournament["id"], msg)
            elif msg_type == "TournamentMoveDone":
                await manager.publish_to_worker(tournament["id"], msg)
            elif msg_type == "TournamentFinished":
                await manager.publish_to_worker(tournament["id"], msg)

    except WebSocketDisconnect:
        print(f"WebSocket disconnected for bot {bot_id}")
    finally:
        manager.remove_client(bot_id)


if __name__ == "__main__":
    import uvicorn
    # trunk-ignore(bandit/B104)
    uvicorn.run(app, host="0.0.0.0", port=8000)
