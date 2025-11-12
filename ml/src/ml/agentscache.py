from __future__ import annotations

import os
from typing import Dict, List

from .data_types import Tournament
from .model import TrainableBot
# TODO. remove this class

class AgentsCache:
    def __init__(self, models_path: str) -> None:
        self._models_path = models_path
        os.makedirs(self._models_path, exist_ok=True)
        self._bots: Dict[str, TrainableBot] = {}

    def model_path(self, bot_id: str) -> str:
        return os.path.join(self._models_path, f"{bot_id}.pt")

    def add(self, bot_id: str, rows: int, cols: int) -> TrainableBot:
        if bot_id not in self._bots:
            self._bots[bot_id] = TrainableBot(rows, cols, {"id": bot_id})
            self._bots[bot_id].load(self.model_path(bot_id))

    def move(self, bot_id: str, tournament: Tournament, move: List[int]) -> None:
        self._bots.get(bot_id).record_step(tournament, move)

    def predict(self, bot_id: str):
        ((x, y), _, _) = self._bots.get(bot_id).act(temperature=0.6, greedy=True)
        return (x, y)

    def train(self, bot_id: str, result: float) -> None:
        self._bots.get(bot_id).train(result)
        self._bots.get(bot_id).save(self.model_path(bot_id))

    def grid(self, bot_id: str):
        return self._bots.get(bot_id).get_current_grid()

    def resolution(self, bot_id: str):
        return self._bots.get(bot_id).get_current_resolution()
