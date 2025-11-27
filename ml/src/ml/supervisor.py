# supervisor.py
import os
import asyncio
import multiprocessing as mp
from typing import Dict
import redis.asyncio as redis
import json

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
OK_REPLY = {"status": "ok"}
BOTS_PATH = "./bots"

async def shutdown(ps, r, *channels):
    await ps.unsubscribe(*channels)
    await ps.aclose()
    await r.aclose()


def spawn_tournament_worker(bot_id: str, tournament_id: str) -> mp.Process:
    p = mp.Process(target=run_tournament_worker, args=(REDIS_URL, bot_id, tournament_id), daemon=True)
    p.start()
    return p


def run_tournament_worker(redis_url: str, bot_id: str, tournament_id: str):
    import asyncio
    asyncio.run(tournament_worker_main(redis_url, bot_id, tournament_id))


async def tournament_worker_main(redis_url: str, bot_id: str, tournament_id: str):
    import json
    import redis.asyncio as redis
    from .model import TrainableBot
    from .data_types import Result

    r = redis.from_url(redis_url, encoding="utf-8", decode_responses=True,
                       health_check_interval=30, socket_keepalive=True,
                       socket_connect_timeout=5, socket_timeout=None)
    input_channel  = f"tournament:{bot_id}:{tournament_id}:in"
    output_channel = f"tournament:{bot_id}:{tournament_id}:out"
    print(f"[worker {bot_id}:{tournament_id}] accepting commands on {input_channel}...")

    try:
        os.makedirs(BOTS_PATH, exist_ok=True)
        bot = None

        while True:
            _, raw = await r.blpop(input_channel)
            tournament_event = json.loads(raw)
            if bot is None:
                bot = TrainableBot(tournament_event["tournament"]["dims"][0],
                                   tournament_event["tournament"]["dims"][1],
                                   {"id": bot_id})
                bot.load(os.path.join(BOTS_PATH, f"{bot_id}.pt"))
                print(f"[worker {bot_id}:{tournament_id}] bot {bot_id} created and model loaded.")
            if tournament_event["type"] == "JoinTournament":
                print(f"[worker {bot_id}:{tournament_id}] event: Joined tournament {tournament_event}")
                tournament = tournament_event["tournament"]
                await r.lpush(output_channel, json.dumps(tournament_event))
            elif tournament_event["type"] == "TournamentAskForCoord":
                tournament = tournament_event["tournament"]
                x, y = bot.act(greedy=True)
                await r.lpush(output_channel, json.dumps({
                    "type": "TournamentAskForCoord",
                    "tournament": tournament,
                    "coord": (x, y),
                }))
            elif tournament_event["type"] == "TournamentMoveDone":
                print(f"[worker {bot_id}:{tournament_id}] event: Move done {tournament_event}")
                tournament = tournament_event["tournament"]
                bot.record_step(tournament, tournament_event["move"])
                await r.lpush(output_channel, json.dumps({
                    "type": "TournamentMoveDone",
                    "tournament": tournament,
                    "move": tournament_event["move"],
                    "grid": bot.get_current_grid(),
                    "resolution": bot.get_current_resolution(),
                }))
            elif tournament_event["type"] == "TournamentTrainBot":
                await r.lpush(output_channel, json.dumps({
                    "type": "TournamentTrainBot",
                    "tournament": tournament,
                    "winner": tournament_event["winner"]
                }))
                if tournament_event["winner"] == "draw":
                    print(f"[worker {bot_id}:{tournament_id}] training bot {bot_id} with draw")
                    bot.train(Result.DRAW.value)
                elif tournament_event["winner"] == "me":
                    print(f"[worker {bot_id}:{tournament_id}] training bot {bot_id} with win")
                    bot.train(Result.WIN.value)
                elif tournament_event["winner"] == "opp":
                    print(f"[worker {bot_id}:{tournament_id}] training bot {bot_id} with loss")
                    bot.train(Result.LOSS.value)
                break
            elif tournament_event["type"] == "TournamentFinished":
                await r.lpush(output_channel, json.dumps({
                    "type": "TournamentFinished",
                    "tournament": tournament,
                }))
                break
    except Exception as e:
        print(f"[worker {bot_id}:{tournament_id}] exception: {e}")
    finally:
        print(f"[worker {bot_id}:{tournament_id}] shutting down...")
        await r.aclose()

# TODO. I think we need to create one process per bot. Because of TournamentFinished, which is sent from all bots simultaneously.
#       So, one signal from one bot can terminate the worker, while other bots are still sending messages to it.
#       But investigate how movements are synchronized between bots in a tournament first.
# TODO. There is an issue with multiple bots joining different tournaments. For some reason, I saw tournaments getting mixed up.


async def supervisor_main():
    r = redis.from_url(REDIS_URL, encoding="utf-8", decode_responses=True)
    tournaments: Dict[str, mp.Process] = {}
    channel = "events"

    try:
        while True:
            _, data = await r.blpop(channel)
            bot_id, tournament_id = data.split(":")
            await r.lpush(channel, json.dumps(OK_REPLY))
            print(f"[supervisor] created new worker for bot {bot_id} {tournament_id}...")
            if bot_id not in tournaments or not tournaments[bot_id].is_alive():
                p = spawn_tournament_worker(bot_id, tournament_id)
                # TODO. Let remove from tournaments when process ends.
                tournaments[bot_id+tournament_id] = p
    finally:
        for _, p in list(tournaments.items()):
            if p.is_alive():
                p.terminate()
        print("[supervisor] shutting down...")
        await r.delete(channel)
        await r.aclose()


if __name__ == "__main__":
    mp.set_start_method("spawn", force=True)
    asyncio.run(supervisor_main())
