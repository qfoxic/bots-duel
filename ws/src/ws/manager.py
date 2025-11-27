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
        """Notify all connected bots(web) that satisfy the condition."""
        for bot_id, ws in self._clients.items():
            if cond(bot_id):
                await ws.send_text(msg)

    async def notify_bot(self, bot_id: str, msg):
        """Notify a specific bot(web) by id."""
        if bot_id in self._clients:
            ws = self._clients[bot_id]
            await ws.send_text(msg)

    async def notify_worker(self, bot_id: str, msg):
        """Notify all worker (supervisor) in the tournament."""
        await self.publish_to_worker(bot_id, msg)

    async def create_tournament(self, tournament: Tournament):
        tournament_id = tournament["id"]

        if tournament_id in self._tournaments:
            return

        print("Creating new tournament:", tournament)
        self._tournaments[tournament_id] = tournament

    async def join_tournament(self, tournament: Tournament):
        participants = tournament["participants"]
        bot_id = tournament["bot"]["id"]
        tournament_id = tournament["id"]

        if tournament_id not in self._tournaments:
            print("join_tournament: Tournament not found:", tournament)
            return

        if len(participants) < MAX_PARTICIPANTS and bot_id not in participants:
            participants.append(bot_id)
            tournament["status"] = Status.ACTIVE

        self._tournaments[tournament_id] = tournament

    async def start(self):
        self._redis = redis.from_url(self._dsn, encoding="utf-8", decode_responses=True)

    async def stop(self):
        for t in list(self._tasks):
            t.cancel()
        if self._redis:
            await self._redis.close()

    async def publish_to_worker(self, bot_id: str, tournament_id: str, payload: str):
        print("\n\nPublishing to worker:", bot_id, tournament_id, payload)
        await self._redis.lpush(f"tournament:{bot_id}:{tournament_id}:in", json.dumps(payload))
        _, raw = await self._redis.blpop(f"tournament:{bot_id}:{tournament_id}:out")
        print("Received from worker:", bot_id, raw, "\n\n")
        return raw

    async def clear_worker_channels(self, bot_id: str, tournament_id: str):
        await self._redis.delete(f"tournament:{bot_id}:{tournament_id}:in")
        await self._redis.delete(f"tournament:{bot_id}:{tournament_id}:out")

    async def create_worker_channel(self, bot_id: str, tournament_id: str):
        channel = "events"
        await self._redis.lpush(channel, f"{bot_id}:{tournament_id}")
        await self._redis.blpop(channel)

# Global WebSocket manager instance
manager = RedisManager(REDIS_URL)
