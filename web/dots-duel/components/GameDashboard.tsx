'use client'
import { Stage, Layer, Rect as KRect } from 'react-konva'
import React, { useMemo, useRef } from 'react'
import Konva from 'konva'
import { Bot } from '@/types/Bot'
import {
  DSU, DIRS8, GRID_COLS, GRID_ROWS, cellId,
  inBounds, collectComponent, getBBox, analyzeInterior
} from '@/utils/gameengine'

const CELL_SIZE = 9
const GAME_WIDTH = GRID_COLS * CELL_SIZE
const GAME_HEIGHT = GRID_ROWS * CELL_SIZE
const DEFAULT_FILL = '#9ca3af'
const MY_TURN_COLOR = '#ef4444'
const OPP_TURN_COLOR = '#3b82f6'
const CELL_BORDER = '#374151'
const CELL_BORDER_WIDTH = 0.5

function hexToRgba(hex: string, alpha: number) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return `rgba(0,0,0,${alpha})`
  const r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

interface GameDashboardProps {
  currentBot: Bot | null
  currentPlayer: Bot | null
  opponentBot?: Bot | null
}

export function GameDashboard({ currentBot, currentPlayer, opponentBot }: GameDashboardProps) {
  // 0=empty, 1=my, 2=opponent
  const gridRef = useRef<Uint8Array>(new Uint8Array(GRID_ROWS * GRID_COLS))
  const closedCellsRef = useRef<Set<number>>(new Set())
  const myDsuRef = useRef<DSU>(new DSU(GRID_ROWS * GRID_COLS))
  const oppDsuRef = useRef<DSU>(new DSU(GRID_ROWS * GRID_COLS))
  const rectRefsRef = useRef<Array<Konva.Rect | null>>(Array(GRID_ROWS * GRID_COLS).fill(null))
  const layerRef = useRef<Konva.Layer | null>(null)

  const opponentRef = useRef<Bot | null>(opponentBot ?? null)
  opponentRef.current = opponentBot ?? null

  function markCellsClosed(cells: [number, number][], playerVal: 1 | 2) {
    const layer = layerRef.current
    if (!layer) return

    const baseHex = playerVal === 1 ? MY_TURN_COLOR : OPP_TURN_COLOR
    const emptyFill = hexToRgba(baseHex, 0.58)

    for (const [x, y] of cells) {
      const id = cellId(x, y)
      if (closedCellsRef.current.has(id)) continue
      closedCellsRef.current.add(id)

      const node = rectRefsRef.current[id]
      if (!node) continue

      node.listening(false)

      if (gridRef.current[id] === 0) {
        node.fill(emptyFill)
        node.fillEnabled(true)
      }
    }
    layer.batchDraw()
  }

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const node = e.target
    if (!node || node.getClassName() !== 'Rect') return

    const rect = node as Konva.Rect
    const [sx, sy] = (rect.name() || '').split('-')
    const gx = parseInt(sx, 10), gy = parseInt(sy, 10)
    if (!Number.isFinite(gx) || !Number.isFinite(gy) || !inBounds(gx, gy)) return

    const idx = cellId(gx, gy)

    if (closedCellsRef.current.has(idx)) return
    if (gridRef.current[idx] !== 0) return

    const isMyTurn = !!(currentPlayer?.id && currentBot?.id && currentPlayer.id === currentBot.id)
    const playerVal = (isMyTurn ? 1 : 2) as 1 | 2
    const color = isMyTurn ? MY_TURN_COLOR : OPP_TURN_COLOR

    gridRef.current[idx] = playerVal
    rect.fill(color)

    const dsu = isMyTurn ? myDsuRef.current : oppDsuRef.current
    let cycleDetected = false
    for (const [dx, dy] of DIRS8) {
      const nx = gx + dx, ny = gy + dy
      if (!inBounds(nx, ny)) continue
      const nIdx = cellId(nx, ny)
      if (gridRef.current[nIdx] !== playerVal) continue
      if (!dsu.union(idx, nIdx)) cycleDetected = true
    }
    if (!cycleDetected) return

    const comp = collectComponent(gx, gy, playerVal, gridRef.current)
    const bbox = getBBox(comp)
    const res = analyzeInterior(bbox, comp, playerVal, gridRef.current)
    if (res.allCells.length === 0) return

    markCellsClosed(res.allCells, playerVal)
  }

  const cells = useMemo(() => {
    const arr: React.ReactNode[] = []
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        arr.push(
          <KRect
            key={`${x}-${y}`}
            name={`${x}-${y}`}
            x={x * CELL_SIZE}
            y={y * CELL_SIZE}
            width={CELL_SIZE}
            height={CELL_SIZE}
            fill={DEFAULT_FILL}
            stroke={CELL_BORDER}
            strokeWidth={CELL_BORDER_WIDTH}
            ref={(node) => { rectRefsRef.current[cellId(x, y)] = node }}
          />
        )
      }
    }
    return arr
  }, [])

  return (
    <div className="flex items-center justify-center h-full bg-gray-900 p-4">
      <Stage width={GAME_WIDTH} height={GAME_HEIGHT}>
        <Layer ref={layerRef} onClick={handleClick}>
          {cells}
        </Layer>
      </Stage>
    </div>
  )
}
