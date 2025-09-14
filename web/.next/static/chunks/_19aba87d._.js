(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/types/Message.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Result",
    ()=>Result,
    "Winner",
    ()=>Winner
]);
var Result = /*#__PURE__*/ function(Result) {
    Result[Result["WIN"] = 1] = "WIN";
    Result[Result["LOSS"] = -1] = "LOSS";
    Result[Result["DRAW"] = 0] = "DRAW";
    return Result;
}({});
var Winner = /*#__PURE__*/ function(Winner) {
    Winner["ME"] = "me";
    Winner["OPP"] = "opp";
    Winner["DRAW"] = "draw";
    return Winner;
}({});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/GameDashboard.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GameDashboard",
    ()=>GameDashboard,
    "MY_TURN_COLOR",
    ()=>MY_TURN_COLOR,
    "OPP_TURN_COLOR",
    ()=>OPP_TURN_COLOR
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$BotsContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/contexts/BotsContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$TournamentsContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/contexts/TournamentsContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$Bot$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/types/Bot.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$Message$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/types/Message.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$Tournament$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/types/Tournament.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$konva$2f$es$2f$ReactKonva$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/react-konva/es/ReactKonva.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$konva$2f$es$2f$ReactKonvaCore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-konva/es/ReactKonvaCore.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
;
;
const CELL_SIZE = 13;
const GAME_WIDTH = __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$Tournament$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GRID_COLS"] * CELL_SIZE;
const GAME_HEIGHT = __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$Tournament$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GRID_ROWS"] * CELL_SIZE;
const DEFAULT_FILL = '#9ca3af';
const CELL_BORDER = '#374151';
const CELL_BORDER_WIDTH = 0.5;
const MY_TURN_COLOR = '#ef4444';
const OPP_TURN_COLOR = '#3b82f6';
const COLOR_BY_VAL = {
    1: MY_TURN_COLOR,
    2: OPP_TURN_COLOR,
    3: '#111827',
    4: '#7c3aed',
    5: '#6d28d9'
};
const cellId = (x, y)=>y * __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$Tournament$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GRID_COLS"] + x;
function GameDashboard(param) {
    let { initialTournament, currentBot } = param;
    _s();
    // 0=empty, 1=my, 2=opponent
    const { onMessage, sendWebSocketMessage } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$BotsContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBots"])();
    const { currentTournament, setCurrentTournament, setTournaments } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$TournamentsContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTournaments"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [currentOpponent, setCurrentOpponent] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialTournament.owner.id === currentBot.id ? null : initialTournament.owner);
    const [currentPlayer, setCurrentPlayer] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialTournament.owner);
    const rectRefsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])([]);
    const layerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [toast, setToast] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useState({
        title: ''
    });
    const [finished, setFinished] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useState(false);
    const [botIsTraining, setBotIsTraining] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useState(false);
    const finishedRef = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useRef(false);
    const capsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])({
        myCaptures: 0,
        oppCaptures: 0
    });
    const oppRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(initialTournament.owner.id === currentBot.id ? null : initialTournament.owner);
    const showGameOverToast = (winner)=>{
        let title = "Draw ".concat(capsRef.current.myCaptures, ":").concat(capsRef.current.oppCaptures);
        if (winner === __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$Message$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Winner"].ME) {
            title = "You win ".concat(capsRef.current.myCaptures, ":").concat(capsRef.current.oppCaptures);
        } else if (winner === __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$Message$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Winner"].OPP) {
            title = "You lose ".concat(capsRef.current.myCaptures, ":").concat(capsRef.current.oppCaptures);
        }
        setToast({
            title
        });
    };
    const applyGrid = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useCallback({
        "GameDashboard.useCallback[applyGrid]": (grid)=>{
            var _layerRef_current;
            const n = Math.min(grid.length, __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$Tournament$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GRID_ROWS"] * __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$Tournament$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GRID_COLS"]);
            for(let i = 0; i < n; i++){
                const v = grid[i];
                if (v === 0) continue;
                const rect = rectRefsRef.current[i];
                if (!rect) continue;
                const color = COLOR_BY_VAL[v];
                if (color) rect.setAttrs({
                    fill: color,
                    listening: false
                });
            }
            (_layerRef_current = layerRef.current) === null || _layerRef_current === void 0 ? void 0 : _layerRef_current.batchDraw();
        }
    }["GameDashboard.useCallback[applyGrid]"], []);
    const onCellClick = (e)=>{
        var _layerRef_current;
        if (finishedRef.current) return;
        const node = e.target;
        if (!node || node.getClassName() !== 'Rect') return;
        if ((currentTournament === null || currentTournament === void 0 ? void 0 : currentTournament.status) !== 'active') return;
        if (!currentBot || !currentPlayer) return;
        if (currentPlayer.id !== currentBot.id) return;
        if (currentBot.type === __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$Bot$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BotType"].AUTO) return;
        const rect = node;
        const [sx, sy] = (rect.name() || '').split('-');
        const gx = parseInt(sx, 10), gy = parseInt(sy, 10);
        setCurrentPlayer(oppRef.current);
        rect.setAttrs({
            fill: MY_TURN_COLOR,
            listening: false
        });
        (_layerRef_current = layerRef.current) === null || _layerRef_current === void 0 ? void 0 : _layerRef_current.batchDraw();
        sendWebSocketMessage({
            type: 'TournamentMoveDone',
            tournament: {
                ...currentTournament,
                bot: currentBot
            },
            move: [
                gx,
                gy
            ]
        });
    };
    const cells = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "GameDashboard.useMemo[cells]": ()=>{
            const arr = [];
            for(let y = 0; y < __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$Tournament$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GRID_ROWS"]; y++){
                for(let x = 0; x < __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$Tournament$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GRID_COLS"]; x++){
                    arr.push(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$konva$2f$es$2f$ReactKonvaCore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Rect"], {
                        name: "".concat(x, "-").concat(y),
                        x: x * CELL_SIZE,
                        y: y * CELL_SIZE,
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        fill: DEFAULT_FILL,
                        stroke: CELL_BORDER,
                        strokeWidth: CELL_BORDER_WIDTH,
                        ref: {
                            "GameDashboard.useMemo[cells]": (node)=>{
                                if (rectRefsRef.current) rectRefsRef.current[cellId(x, y)] = node;
                            }
                        }["GameDashboard.useMemo[cells]"]
                    }, "".concat(x, "-").concat(y), false, {
                        fileName: "[project]/components/GameDashboard.tsx",
                        lineNumber: 112,
                        columnNumber: 11
                    }, this));
                }
            }
            return arr;
        }
    }["GameDashboard.useMemo[cells]"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "GameDashboard.useEffect": ()=>{
            oppRef.current = currentOpponent;
        }
    }["GameDashboard.useEffect"], [
        currentOpponent
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "GameDashboard.useEffect": ()=>{
            finishedRef.current = finished;
        }
    }["GameDashboard.useEffect"], [
        finished
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "GameDashboard.useEffect": ()=>{
            const unJoin = onMessage('JoinTournament', {
                "GameDashboard.useEffect.unJoin": (message)=>{
                    if (finishedRef.current) return;
                    setCurrentTournament(message.tournament);
                    setCurrentOpponent(message.tournament.bot);
                    if (currentBot.type === __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$Bot$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BotType"].AUTO) {
                        sendWebSocketMessage({
                            type: 'TournamentAskForCoord',
                            tournament: {
                                ...message.tournament,
                                bot: currentBot
                            }
                        });
                    }
                }
            }["GameDashboard.useEffect.unJoin"]);
            const unMove = onMessage('TournamentMoveDone', {
                "GameDashboard.useEffect.unMove": (message)=>{
                    if (finishedRef.current) return;
                    // TODO. Fix this cast one day.
                    const { tournament, grid, resolution } = message;
                    setCurrentTournament(tournament);
                    setCurrentPlayer(currentBot.id === tournament.bot.id ? oppRef.current : currentBot);
                    applyGrid(grid || []);
                    if (resolution) {
                        const { me, opp, winner } = resolution;
                        capsRef.current.myCaptures = me;
                        capsRef.current.oppCaptures = opp;
                        if (winner) {
                            showGameOverToast(winner);
                            sendWebSocketMessage({
                                type: 'TournamentFinished',
                                tournament: {
                                    ...tournament,
                                    bot: currentBot
                                },
                                winner: winner === __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$Message$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Winner"].DRAW ? "" : winner === __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$Message$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Winner"].ME ? currentBot.id : oppRef.current.id
                            });
                            setFinished(true);
                        }
                    }
                    if (currentBot.type === __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$Bot$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BotType"].AUTO && currentBot.id !== tournament.bot.id) {
                        if (finishedRef.current) return;
                        sendWebSocketMessage({
                            type: 'TournamentAskForCoord',
                            tournament: {
                                ...message.tournament,
                                bot: currentBot
                            }
                        });
                    }
                }
            }["GameDashboard.useEffect.unMove"]);
            const unAsk = onMessage('TournamentAskForCoord', {
                "GameDashboard.useEffect.unAsk": (message)=>{
                    if (finishedRef.current) return;
                    // TODO. Fix this cast one day.
                    const { coord } = message;
                    const [gx, gy] = coord;
                    sendWebSocketMessage({
                        type: 'TournamentMoveDone',
                        tournament: {
                            ...message.tournament,
                            bot: currentBot
                        },
                        move: [
                            gx,
                            gy
                        ]
                    });
                }
            }["GameDashboard.useEffect.unAsk"]);
            return ({
                "GameDashboard.useEffect": ()=>{
                    // TODO. Let's think on events like opponent left tournament etc.
                    // TODO. Add button train bot on tournament end. please it next to back to tournaments button
                    // TODO. We need to fix the issue when opponent joins before owner, then all schema goes crazy
                    unMove();
                    unAsk();
                    unJoin();
                }
            })["GameDashboard.useEffect"];
        }
    }["GameDashboard.useEffect"], [
        applyGrid,
        currentBot,
        onMessage,
        sendWebSocketMessage,
        setCurrentTournament
    ]);
    var _currentOpponent_id;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen w-full bg-gray-950 text-gray-100",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "p-4 grid grid-cols-1 lg:grid-cols-[clamp(260px,24vw,320px)_minmax(0,1fr)] gap-4",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                    className: "rounded-2xl border border-white/10 bg-gray-900/60 shadow-lg p-4 h-[min(80vh,calc(100vh-48px))] flex flex-col gap-4",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-1 gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "rounded-2xl border border-white/10 bg-gradient-to-b from-gray-800/80 to-gray-800/40 p-3 shadow\n              ".concat((currentPlayer === null || currentPlayer === void 0 ? void 0 : currentPlayer.id) === currentBot.id ? 'ring-2 ring-red-400/30' : ''),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex w-full items-center gap-2 flex-wrap",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "flex-auto min-w-0 text-base font-semibold truncate\n                  ".concat((currentPlayer === null || currentPlayer === void 0 ? void 0 : currentPlayer.id) === currentBot.id ? 'text-red-400' : 'text-red-300'),
                                                children: currentBot.id
                                            }, void 0, false, {
                                                fileName: "[project]/components/GameDashboard.tsx",
                                                lineNumber: 211,
                                                columnNumber: 17
                                            }, this),
                                            (currentPlayer === null || currentPlayer === void 0 ? void 0 : currentPlayer.id) === currentBot.id && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "flex-none text-[10px] px-2 py-0.5 rounded-full border border-red-400/30 bg-red-500/10 text-red-300",
                                                children: "turn"
                                            }, void 0, false, {
                                                fileName: "[project]/components/GameDashboard.tsx",
                                                lineNumber: 216,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/GameDashboard.tsx",
                                        lineNumber: 210,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-3 text-xs",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 flex items-center justify-between",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "opacity-70",
                                                    children: "Captures"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/GameDashboard.tsx",
                                                    lineNumber: 225,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "tabular-nums text-red-300 font-medium",
                                                    children: capsRef.current.myCaptures
                                                }, void 0, false, {
                                                    fileName: "[project]/components/GameDashboard.tsx",
                                                    lineNumber: 226,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/GameDashboard.tsx",
                                            lineNumber: 224,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/components/GameDashboard.tsx",
                                        lineNumber: 223,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/GameDashboard.tsx",
                                lineNumber: 206,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "rounded-2xl border border-white/10 bg-gradient-to-b from-gray-800/80 to-gray-800/40 p-3 shadow\n              ".concat((currentPlayer === null || currentPlayer === void 0 ? void 0 : currentPlayer.id) === (currentOpponent === null || currentOpponent === void 0 ? void 0 : currentOpponent.id) ? 'ring-2 ring-blue-400/30' : ''),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex w-full items-center gap-2 flex-wrap",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "flex-auto min-w-0 text-base font-semibold truncate\n                  ".concat((currentPlayer === null || currentPlayer === void 0 ? void 0 : currentPlayer.id) === (currentOpponent === null || currentOpponent === void 0 ? void 0 : currentOpponent.id) ? 'text-blue-400' : 'text-blue-300'),
                                                children: (_currentOpponent_id = currentOpponent === null || currentOpponent === void 0 ? void 0 : currentOpponent.id) !== null && _currentOpponent_id !== void 0 ? _currentOpponent_id : 'waiting...'
                                            }, void 0, false, {
                                                fileName: "[project]/components/GameDashboard.tsx",
                                                lineNumber: 237,
                                                columnNumber: 17
                                            }, this),
                                            (currentPlayer === null || currentPlayer === void 0 ? void 0 : currentPlayer.id) === (currentOpponent === null || currentOpponent === void 0 ? void 0 : currentOpponent.id) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "flex-none text-[10px] px-2 py-0.5 rounded-full border border-blue-400/30 bg-blue-500/10 text-blue-300",
                                                children: "turn"
                                            }, void 0, false, {
                                                fileName: "[project]/components/GameDashboard.tsx",
                                                lineNumber: 242,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/GameDashboard.tsx",
                                        lineNumber: 236,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-3 text-xs",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 flex items-center justify-between",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "opacity-70",
                                                    children: "Captures"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/GameDashboard.tsx",
                                                    lineNumber: 251,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "tabular-nums text-blue-300 font-medium",
                                                    children: capsRef.current.oppCaptures
                                                }, void 0, false, {
                                                    fileName: "[project]/components/GameDashboard.tsx",
                                                    lineNumber: 252,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/GameDashboard.tsx",
                                            lineNumber: 250,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/components/GameDashboard.tsx",
                                        lineNumber: 249,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/GameDashboard.tsx",
                                lineNumber: 232,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/GameDashboard.tsx",
                        lineNumber: 204,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/components/GameDashboard.tsx",
                    lineNumber: 201,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                    className: "rounded-2xl border border-white/10 bg-gray-900/60 shadow-xl p-4 relative overflow-hidden h-[min(80vh,calc(100vh-48px))] flex flex-col",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex-1 flex items-center justify-center overflow-auto",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$konva$2f$es$2f$ReactKonvaCore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Stage"], {
                                width: GAME_WIDTH,
                                height: GAME_HEIGHT,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$konva$2f$es$2f$ReactKonvaCore$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Layer"], {
                                    ref: layerRef,
                                    onClick: onCellClick,
                                    children: cells
                                }, void 0, false, {
                                    fileName: "[project]/components/GameDashboard.tsx",
                                    lineNumber: 263,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/GameDashboard.tsx",
                                lineNumber: 262,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/GameDashboard.tsx",
                            lineNumber: 261,
                            columnNumber: 11
                        }, this),
                        finished && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "pointer-events-none absolute top-3 inset-x-0 z-20 flex justify-center",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "pointer-events-auto flex items-center gap-3 rounded-full border border-white/10 bg-gray-900/95 px-4 py-2 shadow-lg backdrop-blur supports-[backdrop-filter]:backdrop-blur-sm",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-baseline gap-2 min-w-0",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-sm font-semibold truncate",
                                            children: toast.title
                                        }, void 0, false, {
                                            fileName: "[project]/components/GameDashboard.tsx",
                                            lineNumber: 274,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/components/GameDashboard.tsx",
                                        lineNumber: 273,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        disabled: botIsTraining,
                                        onClick: ()=>{
                                            if (currentTournament) {
                                                setBotIsTraining(true);
                                                sendWebSocketMessage({
                                                    type: "TournamentTrainBot",
                                                    tournament: {
                                                        ...currentTournament,
                                                        bot: currentBot
                                                    }
                                                });
                                            }
                                        },
                                        className: "ml-1 inline-flex items-center rounded-md border border-white/10 bg-white/10 px-3 py-1.5 text-xs hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed",
                                        children: botIsTraining ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "mr-1 inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"
                                                }, void 0, false, {
                                                    fileName: "[project]/components/GameDashboard.tsx",
                                                    lineNumber: 293,
                                                    columnNumber: 23
                                                }, this),
                                                "Training..."
                                            ]
                                        }, void 0, true) : "Train bot"
                                    }, void 0, false, {
                                        fileName: "[project]/components/GameDashboard.tsx",
                                        lineNumber: 276,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: ()=>{
                                            if (currentTournament) {
                                                setTournaments((prev)=>prev.map((t)=>t.id === currentTournament.id ? {
                                                            ...t,
                                                            participants: [],
                                                            status: __TURBOPACK__imported__module__$5b$project$5d2f$types$2f$Tournament$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TournamentStatus"].COMPLETED
                                                        } : t));
                                            }
                                            setCurrentTournament(null);
                                            router.push('/');
                                        },
                                        className: "ml-1 inline-flex items-center rounded-md border border-white/10 bg-white/10 px-3 py-1.5 text-xs hover:bg-white/15",
                                        children: "Back to tournaments"
                                    }, void 0, false, {
                                        fileName: "[project]/components/GameDashboard.tsx",
                                        lineNumber: 300,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/GameDashboard.tsx",
                                lineNumber: 271,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/GameDashboard.tsx",
                            lineNumber: 270,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/GameDashboard.tsx",
                    lineNumber: 259,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/GameDashboard.tsx",
            lineNumber: 199,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/GameDashboard.tsx",
        lineNumber: 198,
        columnNumber: 5
    }, this);
}
_s(GameDashboard, "WSqJCYHGOAWv9QDacsMPMXjC+cM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$BotsContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBots"],
        __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$TournamentsContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTournaments"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = GameDashboard;
var _c;
__turbopack_context__.k.register(_c, "GameDashboard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/GameDashboard.tsx [app-client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/components/GameDashboard.tsx [app-client] (ecmascript)"));
}),
]);

//# sourceMappingURL=_19aba87d._.js.map