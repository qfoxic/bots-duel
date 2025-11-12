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

    try:
        while True:
            msg = json.loads(await ws.receive_text())
            msg_type = msg["type"]
            tournament = msg["tournament"]
            current_bot_id = tournament["bot"]["id"]
            match msg_type:
                case "CreateTournament":
                    await manager.create_tournament(tournament)
                    await manager.notify_bots(lambda bot_id, owner=tournament["owner"]: bot_id != owner["id"], json.dumps(msg))
                case "JoinTournament":
                    await manager.create_worker_channel(current_bot_id)
                    await manager.join_tournament(tournament)
                    await manager.publish_to_worker(current_bot_id, msg)
                    await manager.notify_bots(lambda bot_id, cid=current_bot_id: bot_id != cid, json.dumps(msg))
                case "TournamentMoveDone":
                    for pid in tournament["participants"]:
                        reply = await manager.publish_to_worker(pid, msg)
                        await manager.notify_bot(pid, reply)
                case "TournamentAskForCoord":
                    reply = await manager.publish_to_worker(current_bot_id, msg)
                    await manager.notify_bot(current_bot_id, reply)
                case "TournamentTrainBot":
                    pass  # TODO. implement this
                case "TournamentFinished":
                    reply = await manager.publish_to_worker(current_bot_id, msg)
                    await manager.notify_bot(current_bot_id, reply)

    except WebSocketDisconnect as e:
        print(f"WebSocket disconnected for bot {bot_id}: {e}")
    finally:
        manager.remove_client(bot_id)


if __name__ == "__main__":
    import uvicorn
    # trunk-ignore(bandit/B104)
    uvicorn.run(app, host="0.0.0.0", port=8000)
