'use client'
import { useBots } from '@/contexts/BotsContext'
import { useTournaments } from '@/contexts/TournamentsContext'
import { Bot, BotType } from '@/types/Bot'
import { Coord } from '@/types/Coord'
import { Result, TournamentAskForCoordEvent, TournamentMoveDoneEvent, Winner } from '@/types/Message'
import { GRID_COLS, GRID_ROWS, Tournament, TournamentStatus } from '@/types/Tournament'
import Konva from 'konva'
import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Rect as KRect, Layer, Stage } from 'react-konva'

const CELL_SIZE = 13;
const GAME_WIDTH = GRID_COLS * CELL_SIZE;
const GAME_HEIGHT = GRID_ROWS * CELL_SIZE;
const DEFAULT_FILL = '#9ca3af';
const CELL_BORDER = '#374151';
const CELL_BORDER_WIDTH = 0.5;
export const MY_TURN_COLOR = '#ef4444';
export const OPP_TURN_COLOR = '#3b82f6';
const COLOR_BY_VAL: Record<number, string> = {
  1: MY_TURN_COLOR,
  2: OPP_TURN_COLOR,
  3: '#111827', // occupied but empty cell
  4: '#7c3aed', // my captured cell
  5: '#6d28d9', // opponent captured cell
};

const cellId = (x: number, y: number) => y * GRID_COLS + x;

type Caps = {
  myCaptures: number;
  oppCaptures: number;
};

type GameDashboardProps = {
  initialTournament: Tournament
  currentBot: Bot
}

export function GameDashboard({ initialTournament, currentBot }: GameDashboardProps) {
  // 0=empty, 1=my, 2=opponent
  const { onMessage, sendWebSocketMessage } = useBots();
  const { currentTournament, setCurrentTournament, setTournaments } = useTournaments();
  const router = useRouter();
  const [currentOpponent, setCurrentOpponent] = useState<Bot | null>(initialTournament.owner.id === currentBot.id ? null : initialTournament.owner);
  const [currentPlayer, setCurrentPlayer] = useState<Bot>(initialTournament.owner);
  const rectRefsRef = useRef<Array<Konva.Rect | null>>([]);
  const layerRef = useRef<Konva.Layer>(null);
  const [toast, setToast] = React.useState<{ title: string }>({ title: '' });
  const [finished, setFinished] = React.useState<boolean>(false);
  const finishedRef = React.useRef(false);
  const capsRef = useRef<Caps>({ myCaptures: 0, oppCaptures: 0 });
  const oppRef = useRef<Bot | null>(
    initialTournament.owner.id === currentBot.id ? null : initialTournament.owner
  );

  const showGameOverToast = (winner: Winner) => {
    let title = `Draw ${capsRef.current.myCaptures}:${capsRef.current.oppCaptures}`;
    if (winner === Winner.ME) {
      title = `You win ${capsRef.current.myCaptures}:${capsRef.current.oppCaptures}`;
    } else if (winner === Winner.OPP) {
      title = `You lose ${capsRef.current.myCaptures}:${capsRef.current.oppCaptures}`;
    }
    setToast({ title });
  };

  const applyGrid = React.useCallback((grid: number[]) => {
    const n = Math.min(grid.length, GRID_ROWS * GRID_COLS);
    for (let i = 0; i < n; i++) {
      const v = grid[i];
      if (v === 0) continue;
      const rect = rectRefsRef.current[i];
      if (!rect) continue;
      const color = COLOR_BY_VAL[v];
      if (color) rect.setAttrs({ fill: color, listening: false });
    }
    layerRef.current?.batchDraw();
  }, []);

  const onCellClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (finishedRef.current) return;

    const node = e.target;
    if (!node || node.getClassName() !== 'Rect') return;
    if (currentTournament?.status !== 'active') return;
    if (!currentBot || !currentPlayer) return;
    if (currentPlayer.id !== currentBot.id) return;
    if (currentBot.type === BotType.AUTO) return;

    const rect = node as Konva.Rect;
    const [sx, sy] = (rect.name() || '').split('-');
    const gx = parseInt(sx, 10), gy = parseInt(sy, 10);

    setCurrentPlayer(oppRef.current!);
    rect.setAttrs({ fill: MY_TURN_COLOR, listening: false });
    layerRef.current?.batchDraw();

    sendWebSocketMessage({
      type: 'TournamentMoveDone',
      tournament: { ...currentTournament, bot: currentBot },
      move: [gx, gy],
    });
  };

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
            ref={(node) => { if (rectRefsRef.current) rectRefsRef.current[cellId(x, y)] = node }}
          />
        )
      }
    }
    return arr
  }, [])

  useEffect(() => { oppRef.current = currentOpponent }, [currentOpponent]);
  useEffect(() => { finishedRef.current = finished }, [finished]);
  useEffect(() => {
    const unJoin = onMessage('JoinTournament', (message) => {
      if (finishedRef.current) return;
      setCurrentTournament(message.tournament);
      setCurrentOpponent(message.tournament.bot);
      if (currentBot.type === BotType.AUTO) {
        sendWebSocketMessage({
          type: 'TournamentAskForCoord',
          tournament: { ...message.tournament, bot: currentBot }
        });
      }
    });
    const unMove = onMessage('TournamentMoveDone', (message) => {
      if (finishedRef.current) return;
      // TODO. Fix this cast one day.
      const { tournament, grid, resolution } = message as TournamentMoveDoneEvent;

      setCurrentTournament(tournament);
      setCurrentPlayer(currentBot.id === tournament.bot.id ? oppRef.current! : currentBot);
      applyGrid(grid || []);

      if (resolution) {
        const { me, opp, winner } = resolution;
        capsRef.current.myCaptures = me;
        capsRef.current.oppCaptures = opp;
        if (winner) {
          showGameOverToast(winner);
          sendWebSocketMessage({
            type: 'TournamentFinished',
            tournament: { ...tournament, bot: currentBot },
            result: winner === Winner.ME ? Result.WIN : winner === Winner.OPP ? Result.LOSS : Result.DRAW
          });
          setFinished(true);
        }
      }

      if (currentBot.type === BotType.AUTO && currentBot.id !== tournament.bot.id) {
        sendWebSocketMessage({
          type: 'TournamentAskForCoord',
          tournament: { ...message.tournament, bot: currentBot }
        });
      }
    });
    const unAsk = onMessage('TournamentAskForCoord', (message) => {
      if (finishedRef.current) return;
      // TODO. Fix this cast one day.
      const { coord } = message as TournamentAskForCoordEvent;
      const [gx, gy] = coord as Coord;
      sendWebSocketMessage({
        type: 'TournamentMoveDone',
        tournament: { ...message.tournament, bot: currentBot },
        move: [gx, gy]
      });
    });
    return () => {
      // TODO. Let's think on events like opponent left tournament etc.
      unMove();
      unAsk();
      unJoin();
    }
  }, [applyGrid, currentBot, onMessage, sendWebSocketMessage, setCurrentTournament]);

  return (
    <div className="min-h-screen w-full bg-gray-950 text-gray-100">
      <div className="p-4 grid grid-cols-1 lg:grid-cols-[clamp(260px,24vw,320px)_minmax(0,1fr)] gap-4">
        {/* Sidebar */}
        <aside className="rounded-2xl border border-white/10 bg-gray-900/60 shadow-lg p-4
                         h-[min(80vh,calc(100vh-48px))] flex flex-col gap-4">

          <div className="grid grid-cols-1 gap-3">
            {/* Current player card */}
            <div
              className={`rounded-2xl border border-white/10 bg-gradient-to-b from-gray-800/80 to-gray-800/40 p-3 shadow
              ${currentPlayer?.id === currentBot.id ? 'ring-2 ring-red-400/30' : ''}`}
            >
              <div className="flex w-full items-center gap-2 flex-wrap">
                <span className={`flex-auto min-w-0 text-base font-semibold truncate
                  ${currentPlayer?.id === currentBot.id ? 'text-red-400' : 'text-red-300'}`}>
                  {currentBot.id}
                </span>
                {currentPlayer?.id === currentBot.id && (
                  <span className="flex-none text-[10px] px-2 py-0.5 rounded-full border border-red-400/30 bg-red-500/10 text-red-300">
                    turn
                  </span>
                )}
              </div>

              {/* Mini stats — stack on narrow */}
              <div className="mt-3 text-xs">
                <div className="rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 flex items-center justify-between">
                  <span className="opacity-70">Captures</span>
                  <span className="tabular-nums text-red-300 font-medium">{capsRef.current.myCaptures}</span>
                </div>
              </div>
            </div>

            {/* Opponent card */}
            <div
              className={`rounded-2xl border border-white/10 bg-gradient-to-b from-gray-800/80 to-gray-800/40 p-3 shadow
              ${currentPlayer?.id === currentOpponent?.id ? 'ring-2 ring-blue-400/30' : ''}`}
            >
              <div className="flex w-full items-center gap-2 flex-wrap">
                <span className={`flex-auto min-w-0 text-base font-semibold truncate
                  ${currentPlayer?.id === currentOpponent?.id ? 'text-blue-400' : 'text-blue-300'}`}>
                  {currentOpponent?.id ?? 'waiting...'}
                </span>
                {currentPlayer?.id === currentOpponent?.id && (
                  <span className="flex-none text-[10px] px-2 py-0.5 rounded-full border border-blue-400/30 bg-blue-500/10 text-blue-300">
                    turn
                  </span>
                )}
              </div>

              {/* Mini stats — stack on narrow */}
              <div className="mt-3 text-xs">
                <div className="rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 flex items-center justify-between">
                  <span className="opacity-70">Captures</span>
                  <span className="tabular-nums text-blue-300 font-medium">{capsRef.current.oppCaptures}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
        {/* Board */}
        <main className="rounded-2xl border border-white/10 bg-gray-900/60 shadow-xl p-4 relative overflow-hidden
                 h-[min(80vh,calc(100vh-48px))] flex flex-col">
          <div className="flex-1 flex items-center justify-center overflow-auto">
            <Stage width={GAME_WIDTH} height={GAME_HEIGHT}>
              <Layer ref={layerRef} onClick={onCellClick}>
                {cells}
              </Layer>
            </Stage>
          </div>

          {finished && (
            <div className="pointer-events-none absolute top-3 inset-x-0 z-20 flex justify-center">
              <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/10 bg-gray-900/95
                      px-4 py-2 shadow-lg backdrop-blur supports-[backdrop-filter]:backdrop-blur-sm">
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="text-sm font-semibold truncate">{toast.title}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (currentTournament) {
                      setTournaments(prev =>
                        prev.map(t => t.id === currentTournament.id ? { ...t, participants: [], status: TournamentStatus.COMPLETED } : t)
                      );
                    }
                    setCurrentTournament(null);
                    router.push('/');
                  }}
                  className="ml-1 inline-flex items-center rounded-md border border-white/10 bg-white/10 px-3 py-1.5 text-xs
                     hover:bg-white/15"
                >
                  Back to tournaments
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
