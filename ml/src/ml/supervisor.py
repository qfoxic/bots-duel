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


def spawn_tournament_worker(tid: str):
    p = mp.Process(target=run_tournament_worker, args=(REDIS_URL, tid), daemon=True)
    p.start()
    return p


def run_tournament_worker(redis_url: str, tid: str):
    import asyncio
    asyncio.run(tournament_worker_main(redis_url, tid))


async def tournament_worker_main(redis_url: str, tid: str):
    import json
    import redis.asyncio as redis
    from .model import TrainableBot

    r = redis.from_url(redis_url, encoding="utf-8", decode_responses=True,
                       health_check_interval=30, socket_keepalive=True,
                       socket_connect_timeout=5, socket_timeout=None)
    input_channel  = f"tournament:{tid}:in"
    output_channel = f"tournament:{tid}:out"
    print(f"[worker {tid}] accepting commands on {input_channel}...")

    try:
        os.makedirs(BOTS_PATH, exist_ok=True)
        bot = None

        while True:
            _, raw = await r.brpop(input_channel)
            tournament_event = json.loads(raw)
            if bot is None:
                bot_id = tournament_event["tournament"]["bot"]["id"]
                bot = TrainableBot(tournament_event["tournament"]["dims"][0],
                                   tournament_event["tournament"]["dims"][1],
                                   {"id": bot_id})
                bot.load(os.path.join(BOTS_PATH, f"{bot_id}.pt"))
                print(f"[worker {tid}] bot {bot_id} created and model loaded.")
            if tournament_event["type"] == "JoinTournament":
                print(f"[worker {tid}] event: Joined tournament {tournament_event}")
                tournament = tournament_event["tournament"]
                bot_id = tournament["bot"]["id"]
                await r.lpush(output_channel, json.dumps(tournament_event))
            elif tournament_event["type"] == "TournamentAskForCoord":
                tournament = tournament_event["tournament"]
                bot_id = tournament["bot"]["id"]
                x, y = bot.act(greedy=True)
                await r.lpush(output_channel, json.dumps({
                    "type": "TournamentAskForCoord",
                    "tournament": tournament,
                    "coord": (x, y),
                }))
            elif tournament_event["type"] == "TournamentMoveDone":
                print(f"[worker {tid}] event: Move done {tournament_event}")
                tournament = tournament_event["tournament"]
                bot.record_step(tournament, tournament_event["move"])
                await r.lpush(output_channel, json.dumps({
                    "type": "TournamentMoveDone",
                    "tournament": tournament,
                    "move": tournament_event["move"],
                    "grid": bot.get_current_grid(),
                    "resolution": bot.get_current_resolution(),
                }))
            # elif tournament_event["type"] == "TournamentTrainBot":
            #     print(f"[worker {tid}] training bot {tournament_event['winner']}...")
            #     print(f"[worker {tid}] event: {tournament_event}")
            #     for bot in tournament_event["tournament"]["participants"]:
            #         if tournament_event["winner"] == "": # draw
            #             print(f"[worker {tid}] training bot {bot} with draw")
            #             agent.train(bot, 0)
            #         elif tournament_event["winner"] == bot: # won
            #             print(f"[worker {tid}] training bot {bot} with win")
            #             agent.train(bot, 1)
            #         elif tournament_event["winner"] != bot: # lost
            #             print(f"[worker {tid}] training bot {bot} with loss")
            #             agent.train(bot, -1)
            #     return
            elif tournament_event["type"] == "TournamentFinished":
                break
    except Exception as e:
        print(f"[worker {tid}] exception: {e}")
    finally:
        print(f"[worker {tid}] shutting down...")
        await r.aclose()

# TODO. I think we need to create one process per bot. Because of TournamentFinished, which is sent from all bots simultaneously.
#       So, one signal from one bot can terminate the worker, while other bots are still sending messages to it.
#       But investigate how movements are synchronized between bots in a tournament first.
# TODO. Add TournamentDisconnected event which will actually kill the worker if the bot who created the tournament disconnects.
# TODO. There is an issue with multiple bots joining different tournaments. For some reason, I saw tournaments getting mixed up.

async def supervisor_main_old():
    r = redis.from_url(REDIS_URL, encoding="utf-8", decode_responses=True)
    ps = r.pubsub()

    patterns = ["tournament:*:in"]
    await ps.psubscribe(*patterns)
    print(f"[supervisor] is listening for events on channels '{patterns}'")

    tournaments: Dict[str, mp.Process] = {}

    try:
        async for msg in ps.listen():
            if msg.get("type") != "pmessage":
                continue
            # Let's do one worker per bot.
            ch = msg["channel"]         # e.g., "tournament:BOT_ID:in"
            branch, bot_id, _ = ch.split(":")
            match branch:
              case "tournament":
                  if bot_id not in tournaments or not tournaments[bot_id].is_alive():
                      p = spawn_tournament_worker(bot_id)
                      tournaments[bot_id] = p
                      print(f"[supervisor] spawned worker for bot={bot_id} pid={p.pid}")
    finally:
        for _, p in list(tournaments.items()):
            if p.is_alive():
                p.terminate()
        print("[supervisor] shutting down...")
        await shutdown(ps, r, *patterns)


async def supervisor_main():
    r = redis.from_url(REDIS_URL, encoding="utf-8", decode_responses=True)
    tournaments: Dict[str, mp.Process] = {}
    channel = "events"

    try:
        while True:
            _, bot_id = await r.brpop(channel)
            await r.lpush(channel, json.dumps(OK_REPLY))
            print(f"[supervisor] created new worker for bot {bot_id}...")
            if bot_id not in tournaments or not tournaments[bot_id].is_alive():
                p = spawn_tournament_worker(bot_id)
                # TODO. Let remove from tournaments when process ends.
                tournaments[bot_id] = p
    finally:
        for _, p in list(tournaments.items()):
            if p.is_alive():
                p.terminate()
        print("[supervisor] shutting down...")
        await r.aclose()


if __name__ == "__main__":
    mp.set_start_method("spawn", force=True)
    asyncio.run(supervisor_main())
