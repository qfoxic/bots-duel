"use client"

import React, {
  createContext, useContext, useState, useEffect, ReactNode,
  useRef, useCallback, useMemo
} from 'react'
import { Bot, BotType } from '@/types/Bot'
import { TournamentEvents, EventType } from '@/types/Message'

type MessageHandler = (message: TournamentEvents) => void;
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface BotsContextType {
  currentBot: Bot | null;
  setCurrentBot: React.Dispatch<React.SetStateAction<Bot | null>>
  // Connection status can be 'connecting', 'connected', 'disconnected', or 'error'
  connectionStatus: ConnectionStatus
  sendWebSocketMessage: (message: TournamentEvents) => boolean
  onMessage: (messageType: EventType, handler: MessageHandler) => () => void
  connectWebSocket: () => void
  disconnectWebSocket: () => void
  saveBotToSession: (bot: Bot) => void
}

const SESSION_STORAGE_KEY = 'dots-duel-current-bot'
const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000'

const generateRandomBot = (): Bot => {
  const randomId = Math.random().toString().slice(2, 10)
  return { id: randomId, type: BotType.MANUAL }
}

const BotsContext = createContext<BotsContextType | undefined>(undefined)

export function BotsProvider({ children }: { children: ReactNode }) {
  const [currentBot, setCurrentBot] = useState<Bot | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('disconnected');

  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageHandlers = useRef<Map<string, Set<MessageHandler>>>(new Map());

  const clearReconnectTimer = () => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current)
      reconnectTimer.current = null
    }
  };

  function processQueue(msg: TournamentEvents) {
    const handlers = messageHandlers.current.get(msg.type);
    if (!handlers || handlers.size === 0) return;
    for (const h of handlers) {
      try { h(msg); } catch (e) { console.error(e); }
    }
  };

  const sendWebSocketMessage = useCallback((message: TournamentEvents): boolean => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
      return true
    }
    return false
  }, []);
  const saveBotToSession = useCallback((bot: Bot) => {
    try {
      if (typeof window !== 'undefined') sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(bot))
    } catch { }
  }, []);
  const loadBotFromSession = useCallback((): Bot | null => {
    try {
      if (typeof window !== 'undefined') {
        const s = sessionStorage.getItem(SESSION_STORAGE_KEY)
        return s ? (JSON.parse(s) as Bot) : null
      }
      return null
    } catch {
      return null
    }
  }, []);
  const onMessage = useCallback((messageType: EventType, handler: MessageHandler) => {
    let set = messageHandlers.current.get(messageType);
    if (!set) {
      set = new Set();
      messageHandlers.current.set(messageType, set);
    }
    set.add(handler);

    return () => {
      const s = messageHandlers.current.get(messageType);
      if (!s) return;
      s.delete(handler);
      if (s.size === 0) messageHandlers.current.delete(messageType);
    };
  }, []);
  const connect = useCallback(() => {
    const bot = loadBotFromSession();
    if (!bot || ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING))
      return

    clearReconnectTimer();
    setConnectionStatus('connecting');
    const url = `${WS_BASE}/ws/${bot.id}`;
    const socket = new WebSocket(url);
    ws.current = socket

    socket.onopen = () => {
      reconnectAttempt.current = 0;
      setConnectionStatus('connected');
    }

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as TournamentEvents;
        processQueue(message);
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
      }
    }

    socket.onclose = (evt) => {
      ws.current = null
      setConnectionStatus('disconnected')

      // Reconnect on non-normal closes (avoid tight loops)
      if (evt.code !== 1000) {
        const attempt = Math.min(reconnectAttempt.current + 1, 5)
        reconnectAttempt.current = attempt
        const delay = Math.min(1000 * 2 ** (attempt - 1), 8000)
        clearReconnectTimer()
        reconnectTimer.current = setTimeout(() => connect(), delay)
      }
    }

    socket.onerror = () => {
      setConnectionStatus('error')
    }
  }, []);
  const disconnect = useCallback(() => {
    clearReconnectTimer()
    const s = ws.current
    ws.current = null
    if (!s) return
    try {
      if (s.readyState === WebSocket.OPEN || s.readyState === WebSocket.CONNECTING)
        s.close(1000)
    } catch { }
  }, []);

  useEffect(() => {
    connect();
    const fromSession = loadBotFromSession(); // will be null on first run
    const bot = fromSession ?? generateRandomBot();
    setCurrentBot(bot);
    if (!fromSession)
      saveBotToSession(bot);

    return () => {
      disconnect()
    }
  }, []);

  const contextValue = useMemo<BotsContextType>(() => ({
    saveBotToSession,
    currentBot,
    setCurrentBot,
    connectionStatus,
    sendWebSocketMessage,
    onMessage,
    connectWebSocket: connect,
    disconnectWebSocket: disconnect,
  }), [connect, connectionStatus, currentBot, disconnect, onMessage, saveBotToSession, sendWebSocketMessage])

  return (
    <BotsContext.Provider value={contextValue}>
      {children}
    </BotsContext.Provider>
  )
}

export function useBots() {
  const ctx = useContext(BotsContext)
  if (!ctx) throw new Error('useBots must be used within a BotsProvider')
  return ctx
}
