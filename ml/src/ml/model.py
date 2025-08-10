import torch
import torch.nn as nn


class GridEncoder(nn.Module):
    def __init__(self, in_channels=3, hidden=64):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Conv2d(in_channels, hidden, 3, padding=1),
            nn.ReLU(),
            nn.Conv2d(hidden, hidden, 3, padding=1),
            nn.ReLU()
        )

    def forward(self, x):  # [B, 3, H, W]
        return self.encoder(x)  # [B, C, H, W]


class HistoryEncoder(nn.Module):
    def __init__(self, input_dim=3, d_model=64, nhead=4, num_layers=2):
        super().__init__()
        self.embedding = nn.Linear(input_dim, d_model)
        encoder_layer = nn.TransformerEncoderLayer(d_model=d_model, nhead=nhead, batch_first=True)
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)

    def forward(self, history):  # [B, T, 3]
        x = self.embedding(history)  # [B, T, D]
        context = self.transformer(x)  # [B, T, D]
        return context.mean(dim=1)  # [B, D]


class GoalEncoder(nn.Module):
    def __init__(self, num_goals=8, d_model=64):
        super().__init__()
        self.embedding = nn.Embedding(num_goals, d_model)

    def forward(self, goal_id):  # [B]
        return self.embedding(goal_id)  # [B, D]


class PolicyHead(nn.Module):
    def __init__(self, grid_channels=64, context_dim=64, goal_dim=64):
        super().__init__()
        self.fuse_context = nn.Linear(context_dim + goal_dim, grid_channels)
        self.conv = nn.Sequential(
            nn.Conv2d(grid_channels, grid_channels, 3, padding=1),
            nn.ReLU(),
            nn.Conv2d(grid_channels, 1, 1)
        )

    def forward(self, grid_feat, context_vec, goal_vec):  # [B, C, H, W], [B, D], [B, D]
        B, C, H, W = grid_feat.shape
        context_goal = self.fuse_context(torch.cat([context_vec, goal_vec], dim=-1))  # [B, C]
        context_map = context_goal.view(B, C, 1, 1).expand(-1, -1, H, W)  # [B, C, H, W]
        x = grid_feat + context_map
        return self.conv(x).squeeze(1)  # [B, H, W]


class StrategicBotNet(nn.Module):
    def __init__(self, num_goals=8, d_model=64):
        super().__init__()
        self.grid_encoder = GridEncoder(in_channels=3, hidden=d_model)
        self.history_encoder = HistoryEncoder(input_dim=3, d_model=d_model)
        self.goal_encoder = GoalEncoder(num_goals=num_goals, d_model=d_model)
        self.policy = PolicyHead(grid_channels=d_model, context_dim=d_model, goal_dim=d_model)

    def forward(self, grid, history, goal_id):
        """
        grid:    [B, 3, H, W]
        history: [B, T, 3]
        goal_id: [B]
        return:  [B, H, W]
        """
        grid_feat = self.grid_encoder(grid)
        context_vec = self.history_encoder(history)
        goal_vec = self.goal_encoder(goal_id)
        logits = self.policy(grid_feat, context_vec, goal_vec)
        return logits  # [B, H, W]
