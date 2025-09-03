# supervisor.py
import os
import asyncio
import multiprocessing as mp
from typing import Dict
import redis.asyncio as redis

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")


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
    from .agentscache import AgentsCache

    r = redis.from_url(redis_url, encoding="utf-8", decode_responses=True)
    ps = r.pubsub(ignore_subscribe_messages=True)
    chan_in  = f"tournament:{tid}:in"
    chan_out = f"tournament:{tid}:out"

    await ps.subscribe(chan_in)
    print(f"[worker {tid}] subscribed to {chan_in}")

    try:
        agent = AgentsCache(models_path="./bots")
        async for msg in ps.listen():
            tournament_event = json.loads(msg["data"])
            if tournament_event["type"] == "JoinTournament":
                tournament = tournament_event["tournament"]
                agent.add(tournament["bot"]["id"], tournament["dims"][0], tournament["dims"][1])
            elif tournament_event["type"] == "TournamentAskForCoord":
                tournament = tournament_event["tournament"]
                bot_id = tournament["bot"]["id"]
                (x, y) = agent.predict(bot_id)
                await r.publish(chan_out, json.dumps({
                    "type": "TournamentAskForCoord",
                    "tournament": tournament,
                    "coord": (x, y),
                }))
            elif tournament_event["type"] == "TournamentMoveDone":
                tournament = tournament_event["tournament"]
                participants = tournament["participants"]
                # TODO. Do we really need to move all bots here? Or just the one who sent the event?
                for bot in participants:
                    agent.move(bot, tournament, tournament_event["move"])

                for bot in participants:
                    await r.publish(chan_out, json.dumps({
                        "type": "TournamentMoveDone",
                        "tournament": tournament,
                        "bot": bot,
                        "move": tournament_event["move"],
                        "grid": agent.grid(bot),
                        "resolution": agent.resolution(bot),
                    }))
            elif tournament_event["type"] == "TournamentTrainBot":
                print(f"[worker {tid}] training bot {tournament_event['winner']}...")
                print(f"[worker {tid}] event: {tournament_event}")
                for bot in tournament_event["tournament"]["participants"]:
                    if tournament_event["winner"] == "": # draw
                        print(f"[worker {tid}] training bot {bot} with draw")
                        agent.train(bot, 0)
                    elif tournament_event["winner"] == bot: # won
                        print(f"[worker {tid}] training bot {bot} with win")
                        agent.train(bot, 1)
                    elif tournament_event["winner"] != bot: # lost
                        print(f"[worker {tid}] training bot {bot} with loss")
                        agent.train(bot, -1)
                return
            elif tournament_event["type"] == "TournamentFinished":
                break
    finally:
        print(f"[worker {tid}] shutting down...")
        return await shutdown(ps, r, chan_in)

# TODO. I think we need to create one process per bot. Because of TournamentFinished, which is sent from all bots simultaneously.
#       So, one signal from one bot can terminate the worker, while other bots are still sending messages to it.
#       But investigate how movements are synchronized between bots in a tournament first.
# TODO. Add TournamentDisconnected event which will actually kill the worker if the bot who created the tournament disconnects.

async def supervisor_main():
    r = redis.from_url(REDIS_URL, encoding="utf-8", decode_responses=True)
    ps = r.pubsub()

    patterns = ["tournament:*:in", "train:*:in"]
    await ps.psubscribe(*patterns)
    print(f"[supervisor] is listening for events on channels '{patterns}'")

    tournaments: Dict[str, mp.Process] = {}
    trainings: Dict[str, mp.Process] = {}

    try:
        async for msg in ps.listen():
            if msg.get("type") != "pmessage":
                continue

            ch = msg["channel"]         # e.g., "tournament:TOURNAMENT:in", "train:BOT_ID"
            branch, entity_id, _ = ch.split(":")
            match branch:
              case "tournament":
                  if entity_id not in tournaments or not tournaments[entity_id].is_alive():
                      p = spawn_tournament_worker(entity_id)
                      tournaments[entity_id] = p
                      print(f"[supervisor] spawned worker for tournament={entity_id} pid={p.pid}")
              case "train":
                  if entity_id not in trainings or not trainings[entity_id].is_alive():
                      print(f"[supervisor] received train event for bot={entity_id}")
    finally:
        for _, p in list(tournaments.items()):
            if p.is_alive():
                p.terminate()
        for _, p in list(trainings.items()):
            if p.is_alive():
                p.terminate()
        print("[supervisor] shutting down...")
        await shutdown(ps, r, *patterns)


if __name__ == "__main__":
    mp.set_start_method("spawn", force=True)
    asyncio.run(supervisor_main())
