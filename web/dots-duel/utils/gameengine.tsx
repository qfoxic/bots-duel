
export const GRID_ROWS = 60
export const GRID_COLS = 80
export const DIRS8: ReadonlyArray<readonly [number, number]> = [
  [0,-1],[0,1],[-1,0],[1,0],
  [-1,-1],[1,-1],[-1,1],[1,1],
]

export const DIRS4: ReadonlyArray<readonly [number, number]> = [
  [0,-1],[0,1],[-1,0],[1,0],
] as const

export class DSU {
  parent: number[];
  size: number[];
  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.size = Array(n).fill(1);
  }
  find(x: number): number {
    if (this.parent[x] !== x) this.parent[x] = this.find(this.parent[x]);
    return this.parent[x];
  }
  union(a: number, b: number): boolean {
    let ra = this.find(a), rb = this.find(b);
    if (ra === rb) return false;
    if (this.size[ra] < this.size[rb]) [ra, rb] = [rb, ra];
    this.parent[rb] = ra;
    this.size[ra] += this.size[rb];
    return true;
  }
}

export const cellId = (x: number, y: number) => y * GRID_COLS + x
export const inBounds = (x: number, y: number) => x >= 0 && y >= 0 && x < GRID_COLS && y < GRID_ROWS

// BFS algorithm to collect a component
export function collectComponent(
  sx: number, sy: number, playerVal: 1|2, grid: Uint8Array
): Array<[number, number]> {
  const out: Array<[number, number]> = []
  const seen = new Set<number>()
  const q: Array<[number, number]> = [[sx, sy]]
  seen.add(cellId(sx, sy))
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i]
    out.push([x, y])
    for (const [dx, dy] of DIRS8) {
      const nx = x + dx, ny = y + dy
      if (!inBounds(nx, ny)) continue
      const nid = cellId(nx, ny)
      if (grid[nid] !== playerVal || seen.has(nid)) continue
      seen.add(nid)
      q.push([nx, ny])
    }
  }
  return out
}

export function getBBox(points: Array<[number, number]>) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const [x, y] of points) {
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
  minX = Math.max(0, minX - 1)
  minY = Math.max(0, minY - 1)
  maxX = Math.min(GRID_COLS - 1, maxX + 1)
  maxY = Math.min(GRID_ROWS - 1, maxY + 1)
  return { minX, minY, maxX, maxY }
}

export type Coord = [number, number];

export function analyzeInterior(
  bbox: { minX: number; minY: number; maxX: number; maxY: number },
  comp: Array<Coord>,
  playerVal: 1 | 2,
  grid: Uint8Array
): {
  empty: number;
  opponent: number;
  own: number;
  emptyCells: Coord[];
  opponentCells: Coord[];
  ownCells: Coord[];
  allCells: Coord[];
} {
  const w = bbox.maxX - bbox.minX + 1;
  const h = bbox.maxY - bbox.minY + 1;

  // 0=empty, 1=wall (only comp cells), 2=filled from bbox edges
  const mask: number[][] = Array.from({ length: h }, () => Array(w).fill(0));

  for (const [x, y] of comp) {
    const lx = x - bbox.minX, ly = y - bbox.minY;
    if (lx >= 0 && ly >= 0 && lx < w && ly < h) mask[ly][lx] = 1;
  }

  // flood fill
  const inB = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h;
  const q: Coord[] = [];

  for (let x = 0; x < w; x++) {
    if (mask[0][x] === 0)      { mask[0][x] = 2; q.push([x, 0]); }
    if (mask[h - 1][x] === 0)  { mask[h - 1][x] = 2; q.push([x, h - 1]); }
  }
  for (let y = 0; y < h; y++) {
    if (mask[y][0] === 0)      { mask[y][0] = 2; q.push([0, y]); }
    if (mask[y][w - 1] === 0)  { mask[y][w - 1] = 2; q.push([w - 1, y]); }
  }

  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i];
    for (const [dx, dy] of DIRS4) {
      const nx = x + dx, ny = y + dy;
      if (!inB(nx, ny) || mask[ny][nx] !== 0) continue;
      mask[ny][nx] = 2;
      q.push([nx, ny]);
    }
  }

  let empty = 0, opponent = 0, own = 0;
  const emptyCells: Coord[] = [];
  const opponentCells: Coord[] = [];
  const ownCells: Coord[] = [];
  const allCells: Coord[] = [];

  for (let ly = 0; ly < h; ly++) {
    for (let lx = 0; lx < w; lx++) {
      if (mask[ly][lx] !== 0) continue; // not in a closed area
      const gx = bbox.minX + lx;
      const gy = bbox.minY + ly;
      const val = grid[cellId(gx, gy)];
      const coord: Coord = [gx, gy];
      allCells.push(coord);

      if (val === 0) {
        empty++;
        emptyCells.push(coord);
      } else if (val === playerVal) {
        own++;
        ownCells.push(coord);
      } else {
        opponent++;
        opponentCells.push(coord);
      }
    }
  }

  return { empty, opponent, own, emptyCells, opponentCells, ownCells, allCells };
}
