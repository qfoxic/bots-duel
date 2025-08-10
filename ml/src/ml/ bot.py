import torch
import torch.nn.functional as F
from pathlib import Path
import numpy as np
from .model import StrategicBotNet

#TODO. Let's start with simple things and pass grid data, then moves into predict
#TODO. Later we can dynamically obtain a bot's approach from the game, using feature extraction methods.

class Bot:
    def __init__(self, bot_id: str, device: str = "cpu"):
        self.bot_id = bot_id
        self.device = device
        self.model = StrategicBotNet()
        self.model.to(self.device)
        self.model.eval()

        self.weights_path = Path(f"models/{bot_id}.pt")
        if self.weights_path.exists():
            self.load_weights()
        else:
            print(f"[INFO] No weights found for '{bot_id}', using untrained model.")

        self._optimizer = None

    def load_weights(self):
        state = torch.load(self.weights_path, map_location=self.device)
        self.model.load_state_dict(state)
        self.model.eval()
        print(f"[OK] Weights loaded for '{self.bot_id}'.")

    def save_weights(self):
        self.weights_path.parent.mkdir(parents=True, exist_ok=True)
        torch.save(self.model.state_dict(), self.weights_path)
        print(f"[OK] Weights saved for '{self.bot_id}'.")

    def get_or_create_optimizer(self, lr=1e-3):
        if self._optimizer is None:
            self._optimizer = torch.optim.Adam(self.model.parameters(), lr=lr)
        return self._optimizer

    def _prepare_grid(self, grid: list[list[int]]) -> torch.Tensor:
        g = np.array(grid)
        own = (g == 1).astype(np.float32)
        enemy = (g == -1).astype(np.float32)
        empty = (g == 0).astype(np.float32)
        stacked = np.stack([own, enemy, empty], axis=0)
        return torch.tensor(stacked)

    def _prepare_history(self, history: list[dict], T: int = 20) -> torch.Tensor:
        padded = [{'x': 0, 'y': 0, 'player': 0}] * max(0, T - len(history)) + history[-T:]
        data = np.array([[m['x'], m['y'], m['player']] for m in padded], dtype=np.float32)
        return torch.tensor(data)

    def predict(self, grid: list[list[int]], history: list[dict], goal_id: int = 0) -> tuple[int, int]:
        self.model.eval()
        x_grid = self._prepare_grid(grid).unsqueeze(0).to(self.device)
        x_hist = self._prepare_history(history).unsqueeze(0).to(self.device)
        x_goal = torch.tensor([goal_id], dtype=torch.long).to(self.device)

        with torch.no_grad():
            logits = self.model(x_grid, x_hist, x_goal)  # [1, H, W]
            probs = torch.softmax(logits.flatten(), dim=0)
            idx = torch.argmax(probs).item()
            H, W = logits.shape[-2:]
            y, x = divmod(idx, W)
            return x, y

    def train_on_batch(self, batch: list[dict], optimizer) -> float:
        self.model.train()
        optimizer.zero_grad()

        x_grid = torch.stack([self._prepare_grid(b['grid']) for b in batch]).to(self.device)
        x_hist = torch.stack([self._prepare_history(b['history']) for b in batch]).to(self.device)
        x_goal = torch.tensor([b.get('goalId', 0) for b in batch], dtype=torch.long).to(self.device)

        H, W = x_grid.shape[-2:]
        target_indices = [
            b['action']['y'] * W + b['action']['x']
            for b in batch
        ]
        y_true = torch.tensor(target_indices, dtype=torch.long).to(self.device)

        logits = self.model(x_grid, x_hist, x_goal)  # [B, H, W]
        y_pred = logits.view(logits.size(0), -1)     # [B, H*W]

        loss = F.cross_entropy(y_pred, y_true)
        loss.backward()
        optimizer.step()

        return loss.item()
