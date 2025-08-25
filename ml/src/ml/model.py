import os
import sys
from collections import deque
from dataclasses import dataclass, field
from typing import List

import torch
import torch.nn as nn
import torch.nn.functional as F

from .data_types import Bot, Tournament

DIRS8 = ((0,-1),(0,1),(-1,0),(1,0),(-1,-1),(1,-1),(-1,1),(1,1))
DIRS4 = ((1,0),(-1,0),(0,1),(0,-1))

@dataclass
class TournamentState:
    rows: int
    cols: int
    idx: int = field(init=False)  # Flattened index for the grid
    is_my_move: bool = field(init=False, default=False)

    # Flat masks, length = rows*cols
    own:       torch.Tensor = field(init=False)
    opp:       torch.Tensor = field(init=False)
    empty:     torch.Tensor = field(init=False)
    occupied:  torch.Tensor = field(init=False)
    last_move: torch.Tensor = field(init=False)

    def __post_init__(self):
        grid_size = self.rows * self.cols

        self.own = torch.zeros(grid_size, dtype=torch.bool)
        self.opp = torch.zeros(grid_size, dtype=torch.bool)
        self.empty = torch.ones(grid_size, dtype=torch.bool)
        self.occupied = torch.zeros(grid_size, dtype=torch.bool)
        self.last_move = torch.zeros(grid_size, dtype=torch.bool)

    def cellindex(self, x: int, y: int) -> int:
        return y * self.cols + x

    def state(self) -> torch.Tensor:
        return torch.stack([
            self.own.float(),
            self.opp.float(),
            self.empty.float(),
            self.occupied.float(),
            self.last_move.float(),
        ], dim=0).view(5, self.rows, self.cols)

    def legal(self) -> torch.Tensor:
        return ~self.occupied

    def clone(self) -> "TournamentState":
        new_state = TournamentState(self.rows, self.cols)
        new_state.own = self.own.clone()
        new_state.opp = self.opp.clone()
        new_state.empty = self.empty.clone()
        new_state.occupied = self.occupied.clone()
        new_state.last_move = self.last_move.clone()
        return new_state


class Board:
    def __init__(self, rows: int, cols: int, owner: Bot = None):
        self.rows = rows
        self.cols = cols
        self.owner: Bot = owner
        self.grid = torch.zeros(rows*cols, dtype=torch.int)  # 0=empty, 1=player1, 2=player2
        self.buffers: List[TournamentState] = []
        self.captures = {"me": 0, "opp": 0}

    def cellindex(self, x: int, y: int) -> int:
        return y * self.cols + x

    def cellcoords(self, idx: int) -> tuple[int, int]:
        return idx % self.cols, idx // self.cols

    def move(self, tournament: Tournament, move: List[int]) -> None:
        state = self.buffers[-1].clone() if self.buffers else TournamentState(self.rows, self.cols)
        x, y = move
        idx = state.cellindex(x, y)
        state.idx = idx
        is_my_move = (self.owner["id"] == tournament["bot"]["id"])
        state.is_my_move = is_my_move

        self.grid[idx] = 1 if is_my_move else 2

        self.captures["me"] += self._check_captures(x, y, 1, 5)
        self.captures["opp"] += self._check_captures(x, y, 2, 4)

        state.own.copy_((self.grid == 1) | (self.grid == 4))
        state.opp.copy_((self.grid == 2) | (self.grid == 5))
        state.empty.copy_(self.grid == 0)
        state.occupied.copy_(self.grid != 0)
        state.last_move.zero_()
        state.last_move[idx] = True
        self.buffers.append(state)

    def states(self) -> List[TournamentState]:
        return self.buffers

    def last_state(self) -> TournamentState:
        return self.buffers[-1] if self.buffers else TournamentState(self.rows, self.cols)

    def _collect_component(self, gx: int, gy: int, player_val: int) -> list[int]:
        start_idx = self.cellindex(gx, gy)
        if int(self.grid[start_idx].item()) != player_val:
            return []

        visited = torch.zeros(self.rows * self.cols, dtype=torch.bool)
        q = deque([start_idx])
        visited[start_idx] = True
        comp_idxs: list[int] = []

        while q:
            idx = q.popleft()
            comp_idxs.append(idx)
            x, y = self.cellcoords(idx)
            for dx, dy in DIRS8:
                nx, ny = x + dx, y + dy
                if 0 <= nx < self.cols and 0 <= ny < self.rows:
                    nidx = self.cellindex(nx, ny)
                    if not visited[nidx] and int(self.grid[nidx].item()) == player_val:
                        visited[nidx] = True
                        q.append(nidx)
        return comp_idxs

    def _get_bbox(self, comp_idxs: list[int]) -> tuple[int, int, int, int]:
        # return (minX, minY, maxX, maxY)
        xs, ys = [], []
        for i in comp_idxs:
            x, y = self.cellcoords(i)
            xs.append(x)
            ys.append(y)
        return (min(xs), min(ys), max(xs), max(ys))

    def _analyze_and_close(self, bbox: tuple[int,int,int,int], comp_idxs: list[int], player_val: int, close_val: int):
        """Mask-based interior analysis using only self.grid:
        - walls = comp cells
        - flood from bbox edges through empty cells
        - mask==0 inside => closed pocket
        - mark empty cells in pocket as 3
        - mark opponent stones in pocket as 5 (optional)
        """
        minX, minY, maxX, maxY = bbox
        w = maxX - minX + 1
        h = maxY - minY + 1

        # 0 = unknown, 1 = wall (component), 2 = reachable from bbox edges
        mask = torch.zeros((h, w), dtype=torch.uint8)

        # walls from component indices
        for idx in comp_idxs:
            gx, gy = self.cellcoords(idx)
            lx, ly = gx - minX, gy - minY
            if 0 <= lx < w and 0 <= ly < h:
                mask[ly, lx] = 1

        # flood-fill from bbox edges through mask==0
        qx, qy = [], []

        def push(x, y):
            if 0 <= x < w and 0 <= y < h and mask[y, x] == 0:
                mask[y, x] = 2
                qx.append(x)
                qy.append(y)

        for x in range(w):
            push(x, 0)
            push(x, h - 1)
        for y in range(h):
            push(0, y)
            push(w - 1, y)

        i = 0
        while i < len(qx):
            x, y = qx[i], qy[i]
            i += 1
            for dx, dy in DIRS4:
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and mask[ny, nx] == 0:
                    mask[ny, nx] = 2
                    qx.append(nx)
                    qy.append(ny)

        opponents = 0

        for ly in range(h):
            for lx in range(w):
                if int(mask[ly, lx].item()) != 0:
                    continue  # not an interior pocket cell
                gx = minX + lx
                gy = minY + ly
                idx = self.cellindex(gx, gy)
                val = int(self.grid[idx].item())

                if val == 0:
                    self.grid[idx] = 3
                elif val != player_val and val != 3 and val != close_val:
                    self.grid[idx] = close_val
                    opponents += 1

        return opponents

    def _check_captures(self, gx: int, gy: int, player_val: int, close_val: int):
        comp = self._collect_component(gx, gy, player_val)
        if not comp:
            return 0
        bbox = self._get_bbox(comp)
        return self._analyze_and_close(bbox, comp, player_val, close_val)

    def game_resolution(self) -> dict:
        free = int((self.grid == 0).sum().item())
        m = int(self.captures["me"])
        o = int(self.captures["opp"])

        opp_gain_max = int((self.grid == 1).sum().item())
        me_gain_max  = int((self.grid == 2).sum().item())

        if (m - o) > opp_gain_max:
            return {"me": m, "opp": o, "winner": "me"}

        if (o - m) > me_gain_max:
            return {"me": m, "opp": o, "winner": "opp"}

        if me_gain_max == 0 and opp_gain_max == 0:
            winner = "draw"
            if m > o:
                winner = "me"
            elif o > m:
                winner = "opp"
            return {"me": m, "opp": o, "winner": winner}

        if free == 0:
            winner = "draw"
            if m > o:
                winner = "me"
            elif o > m:
                winner = "opp"
            return {"me": m, "opp": o, "winner": winner}

        return {"me": m, "opp": o, "winner": None}

    def show_occupied(self):
        print_grid(self.grid.view(self.rows, self.cols).int())


def print_grid(t: torch.Tensor, title: str = "", use_color: bool = True):
    """
    Pretty-print a 2D tensor as a clean grid, with x (cols) on top and y (rows) on the left.
    - Underlines the header.
    - Colors values via ANSI (toggle with use_color).
      0: dim gray, 1: bright red, 2: bright blue, 3: yellow (closed), 5: magenta (sealed opp).
    """
    if title:
        print(title)

    # Ensure 2D
    if t.dim() != 2:
        raise ValueError(f"print_grid expects a 2D tensor, got shape {tuple(t.shape)}")

    arr = t.detach().cpu().numpy()
    H, W = arr.shape

    # ANSI helpers
    def ansi(s, code):
        return f"\033[{code}m{s}\033[0m"

    is_tty = hasattr(sys.stdout, "isatty") and sys.stdout.isatty()
    use_color = use_color and is_tty and ("NO_COLOR" not in os.environ)

    # Map values -> color code (foreground)
    color_map = {
        0: "90",  # dim gray
        1: "91",  # bright red (you)
        2: "94",  # bright blue (opponent)
        3: "93",  # yellow (closed)
        5: "95",  # magenta (sealed opponent)
    }

    def colorize(v: int) -> str:
        s = f"{int(v):2d}"
        if not use_color:
            return s
        code = color_map.get(int(v), "97")  # default bright white for unknowns
        return ansi(s, code)

    # Header (x coordinates)
    header = "     " + " ".join(f"{x:2d}" for x in range(W))
    underline = "     " + " ".join("__"  for _ in range(W))
    print(header)
    print(underline)

    # Rows with y coordinate on the left
    for y, row in enumerate(arr):
        row_str = " ".join(colorize(v) for v in row)
        print(f"{y:2d} | {row_str}")


class ResBlock(nn.Module):
    def __init__(self, ch=64, groups=8):
        super().__init__()
        assert ch % groups == 0, "ch must be divisible by groups"
        self.c1 = nn.Conv2d(ch, ch, 3, padding=1, bias=False)
        self.n1 = nn.GroupNorm(groups, ch)
        self.c2 = nn.Conv2d(ch, ch, 3, padding=1, bias=False)
        self.n2 = nn.GroupNorm(groups, ch)

    def forward(self, x):
        y = F.relu(self.n1(self.c1(x)))
        y = self.n2(self.c2(y))
        return F.relu(x + y)


class AxialBlock(nn.Module):
    def __init__(self, ch=64, heads=4, dropout=0.0):
        super().__init__()
        assert ch % heads == 0, "ch must be divisible by heads"
        self.ln   = nn.LayerNorm(ch)
        self.row  = nn.MultiheadAttention(ch, heads, dropout=dropout, batch_first=True)
        self.col  = nn.MultiheadAttention(ch, heads, dropout=dropout, batch_first=True)

    def _axis_attn(self, x, attn, B, L1, L2, C, perm_fwd, perm_bwd):
        t = x.permute(*perm_fwd).reshape(B*L1, L2, C)  # [B*L1, L2, C]
        t = self.ln(t)
        t,_ = attn(t, t, t)
        return t.reshape(B, L1, L2, C).permute(*perm_bwd)

    def forward(self, x):  # x: [B,C,H,W]
        B, C, H, W = x.shape
        x = x + self._axis_attn(x, self.row, B, H, W, C, (0,2,3,1), (0,3,1,2))  # rows
        x = x + self._axis_attn(x, self.col, B, W, H, C, (0,3,2,1), (0,3,2,1))  # cols
        return x


class PVNetSequential(nn.Module):
    def __init__(self, in_ch=5, ch=64, blocks=10, n_axial=2, heads=4, gn_groups=8):
        super().__init__()

        # Stem
        self.stem = nn.Sequential(
            nn.Conv2d(in_ch, ch, 3, padding=1, bias=False),
            nn.GroupNorm(gn_groups, ch),
            nn.ReLU(inplace=True),
        )

        pos = {
            max(1, min(blocks-1, round((k+1)*blocks/(n_axial+1))))
            for k in range(n_axial)
        }
        ax_pos = sorted(pos)

        layers = []
        for i in range(1, blocks + 1):
            layers.append(ResBlock(ch, groups=gn_groups))
            if i in ax_pos:
                layers.append(AxialBlock(ch, heads=heads))

        self.backbone = nn.Sequential(*layers)

        self.head_pi = nn.Sequential(
            nn.Conv2d(ch, 32, kernel_size=1, bias=False),
            nn.ReLU(inplace=True),
            nn.Conv2d(32, 1, kernel_size=1, bias=True),
        )

        self.head_v = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
            nn.Flatten(),
            nn.Linear(ch, 128),
            nn.ReLU(inplace=True),
            nn.Linear(128, 1),
            nn.Tanh(),
        )

    def forward(self, x, legal_mask=None):  # x: [B,in_ch,H,W]
        B, _, H, W = x.shape

        m = None
        if legal_mask is not None:
            m = legal_mask[:,0] if (legal_mask.dim()==4 and legal_mask.size(1)==1) else legal_mask
            m = (m != 0).to(x.device).view(B, 1, H, W)

        h = self.stem(x)          # [B,ch,H,W]
        h = self.backbone(h)      # [B,ch,H,W]

        logits = self.head_pi(h)  # [B,1,H,W]
        if m is not None:
            logits = logits.masked_fill(~m, float('-inf'))
        value  = self.head_v(h)   # [B,1]
        return logits.squeeze(1), value

    @torch.no_grad()
    def act(self, x, legal_mask, temperature=1.0, greedy=False):
        pi, v = self.forward(x, legal_mask)   # [B,H,W], [B,1]
        B, H, W = pi.shape
        flat = pi.view(B, -1)

        all_inf = torch.isinf(flat).all(-1, keepdim=True)
        flat = torch.where(all_inf, torch.zeros_like(flat), flat)

        if greedy or (temperature is not None and temperature <= 0):
            idx = flat.argmax(-1)
            probs = F.softmax(flat, dim=-1)
        else:
            probs = F.softmax(flat / max(temperature, 1e-6), dim=-1)
            idx = torch.multinomial(probs, 1).squeeze(-1)

        y = idx // W
        x_ = idx %  W
        return torch.stack([x_, y], -1), v.squeeze(-1), probs


class TrainableBot:
    def __init__(self, rows, cols, owner: Bot):
        self.rows = rows
        self.cols = cols
        self.model = PVNetSequential(in_ch=5, ch=64, blocks=6, n_axial=1, heads=4, gn_groups=8)
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model.to(self.device).eval()
        self.opt = torch.optim.AdamW(self.model.parameters(), lr=1e-4, weight_decay=1e-4)
        self.board = Board(rows, cols, owner)

    @torch.no_grad()
    def act(self, temperature: float = 0.6, greedy: bool = False):
        """
        Thin wrapper: pack tensors -> delegate to model.act
        Returns: ((x, y), value, probs_flat)
        """
        st = self.board.last_state()

        x = st.state().to(self.device)         # [5,H,W]
        legal = st.legal().to(self.device)     # [H,W]
        xb = x.unsqueeze(0)                    # [1,5,H,W]
        mb = legal.unsqueeze(0)                # [1,H,W] or [1,1,H,W]

        coords, v, probs = self.model.act(xb, mb, temperature=temperature, greedy=greedy)
        # coords: [B,2] = (x,y). We used B=1.
        x_, y = int(coords[0,0].item()), int(coords[0,1].item())

        return (x_, y), float(v[0].item()), probs[0].cpu()

    def record_step(self, tournament: Tournament, move: List[int]) -> None:
        self.board.move(tournament, move)

    def get_current_grid(self):
        return self.board.grid.tolist()

    def get_current_resolution(self):
        return self.board.game_resolution()

    def train(self, result: float, epochs: int = 1, batch_size: int = 64):
        steps = self.board.states()

        pre      = steps[:-1]
        post     = steps[1:]
        actions  = [s.idx for s in post]
        is_mine  = [s.is_my_move for s in post]
        # train value head on all steps from my perspective
        Xv = torch.stack([s.state() for s in pre], 0).to(self.device)   # [B,5,H,W]
        Mv = torch.stack([s.legal() for s in pre], 0).to(self.device)   # [B,H,W]
        Vv = torch.full((len(pre),), float(result), device=self.device)

        # train policy head only on mine steps
        mine_idx = [i for i, f in enumerate(is_mine) if f]
        Xp = torch.stack([pre[i].state() for i in mine_idx], 0).to(self.device)
        Mp = torch.stack([pre[i].legal() for i in mine_idx], 0).to(self.device)
        Ap = torch.tensor([actions[i] for i in mine_idx], device=self.device, dtype=torch.long)
        Vp = torch.full((len(mine_idx),), float(result), device=self.device)

        self.model.train()
        for _ in range(epochs):
            # ---- VALUE ----
            for b in range(0, len(pre), batch_size):
                xb, mb, vb = Xv[b:b+batch_size], Mv[b:b+batch_size], Vv[b:b+batch_size]
                _, v_pred = self.model(xb, legal_mask=mb)               # [b,1]
                loss_v = F.mse_loss(v_pred.squeeze(1), vb)
                self.opt.zero_grad()
                loss_v.backward()
                torch.nn.utils.clip_grad_norm_(self.model.parameters(), 1.0)
                self.opt.step()

            # ---- POLICY ----
            for b in range(0, len(mine_idx), batch_size):
                xb, mb = Xp[b:b+batch_size], Mp[b:b+batch_size]
                ab, vb = Ap[b:b+batch_size], Vp[b:b+batch_size]
                pi_map, v_pred = self.model(xb, legal_mask=mb)      # [b,H,W], [b,1]
                logp = F.log_softmax(pi_map.view(pi_map.size(0), -1), dim=-1)

                adv  = (vb - v_pred.detach().squeeze(1))
                loss_p = -(logp[torch.arange(ab.size(0), device=self.device), ab] * adv).mean()

                with torch.no_grad():
                    p = logp.exp()
                entropy = -(p * logp).sum(dim=-1).mean()

                loss = loss_p - 0.01 * entropy
                self.opt.zero_grad()
                loss.backward()
                torch.nn.utils.clip_grad_norm_(self.model.parameters(), 1.0)
                self.opt.step()
        self.model.eval()

    def save(self, path: str):
        torch.save(self.model.state_dict(), path)

    def load(self, path: str):
        # TODO. Let's load some basic model if path does not exist.
        if not os.path.exists(path):
            self.save(path)

        sd = torch.load(path, map_location=self.device, weights_only=True)
        self.model.load_state_dict(sd, strict=True)
        self.model.eval()
