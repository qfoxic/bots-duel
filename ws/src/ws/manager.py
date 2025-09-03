import json
import asyncio
from fastapi import WebSocket
import redis.asyncio as redis
from .data_types import Tournament, Status

MAX_PARTICIPANTS = 2
REDIS_URL = "redis://localhost:6379/0"


class RedisManager:
    def __init__(self, dsn: str):
        self._dsn = dsn
        self._redis: redis.Redis | None = None
        self._tasks: set[asyncio.Task] = set()
        self._clients: dict[str, WebSocket] = {}
        self._tournaments: dict[str, Tournament] = {}

    def add_client(self, bot_id: str, websocket: WebSocket):
        self._clients[bot_id] = websocket

    def remove_client(self, bot_id: str):
        if bot_id in self._clients:
            del self._clients[bot_id]

    async def notify_bots(self, cond, msg):
        for bot_id, ws in self._clients.items():
            if cond(bot_id):
                await ws.send_text(json.dumps(msg))

    async def create_tournament(self, tournament: Tournament):
        tournament_id = tournament["id"]

        if tournament_id in self._tournaments:
            return

        print("Creating new tournament:", tournament)
        self._tournaments[tournament_id] = tournament

    async def join_tournament(self, tournament: Tournament):
        print("Joining tournament:", tournament)
        participants = tournament["participants"]
        bot_id = tournament["bot"]["id"]
        tournament_id = tournament["id"]

        if tournament_id not in self._tournaments:
            print("join_tournament: Tournament not found:", tournament)
            return

        if len(participants) < MAX_PARTICIPANTS and bot_id not in participants:
            participants.append(bot_id)
            tournament["status"] = Status.ACTIVE

    async def start(self):
        self._redis = redis.from_url(self._dsn, encoding="utf-8", decode_responses=True)

    async def stop(self):
        for t in list(self._tasks):
            t.cancel()
        if self._redis:
            await self._redis.close()

    async def publish_to_worker(self, tournament_id: str, payload: str):
        await self._redis.publish(f"tournament:{tournament_id}:in", json.dumps(payload))

    async def subscribe_to_worker(self, tournament_id: str, async_callback):
        pubsub = self._redis.pubsub(ignore_subscribe_messages=True)
        print("Subscribing from tournament worker:", tournament_id)
        await pubsub.subscribe(f"tournament:{tournament_id}:out")

        async def reader():
            try:
                async for msg in pubsub.listen():
                    resp = json.loads(msg["data"])
                    await async_callback(resp)
            finally:
                print("Unsubscribing from tournament worker:", tournament_id)
                await pubsub.unsubscribe(f"tournament:{tournament_id}:out")
                await pubsub.aclose()

        task = asyncio.create_task(reader())
        self._tasks.add(task)
        task.add_done_callback(lambda t: self._tasks.discard(t))


# Global WebSocket manager instance
manager = RedisManager(REDIS_URL)
