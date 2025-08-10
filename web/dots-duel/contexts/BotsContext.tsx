"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react'
import { Bot } from '@/types/Bot'
import { TournamentEvents } from '@/types/Message'

type MessageHandler = (message: TournamentEvents ) => void

interface BotsContextType {
  currentBot: Bot | null
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  sendWebSocketMessage: (message: TournamentEvents ) => boolean
  onMessage: (messageType: string, handler: MessageHandler) => void
  offMessage: (messageType: string) => void
}

const BotsContext = createContext<BotsContextType | undefined>(undefined)
const SESSION_STORAGE_KEY = 'dots-duel-current-bot'

export function BotsProvider({ children }: { children: ReactNode }) {
  const [currentBot, setCurrentBot] = useState<Bot | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const ws = useRef<WebSocket | null>(null)
  const messageHandlers = useRef<Map<string, MessageHandler>>(new Map())

  const loadBotFromSession = (): Bot | null => {
    try {
      const storedBot = sessionStorage.getItem(SESSION_STORAGE_KEY)
      if (storedBot) {
        return JSON.parse(storedBot)
      }
    } catch (error) {
      console.error('Error loading bot from session storage:', error)
    }
    return null
  }

  const saveBotToSession = (bot: Bot) => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(bot))
    } catch (error) {
      console.error('Error saving bot to session storage:', error)
    }
  }

  const generateRandomBot = (): Bot => {
    const randomId = Math.random().toString().substring(2, 10)
    const wins = 0
    const losses = 0
    const rating = 0

    return {
      id: randomId,
      type: 'manual',
      wins,
      losses,
      rating,
      status: 'active' as const
    }
  }

  const connectWebSocket = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN || !currentBot) return

    setConnectionStatus('connecting')

    const wsUrl = `ws://localhost:8000/ws/${currentBot.id}?bot_type=${currentBot.type}`
    ws.current = new WebSocket(wsUrl)

    ws.current.onopen = () => {
      setConnectionStatus('connected')
    }

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        const handler = messageHandlers.current.get(message.type)
        if (handler) {
          handler(message)
        }

      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    ws.current.onclose = () => {
      setConnectionStatus('disconnected')
    }

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error)
      setConnectionStatus('error')
    }
  }, [currentBot])

  const disconnectWebSocket = useCallback(() => {
    if (ws.current) {
      ws.current.close(1000)
      ws.current = null
    }
  }, [])

  const sendWebSocketMessage = useCallback((message: object): boolean => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
      return true
    }
    return false
  }, [])

  const onMessage = useCallback((messageType: string, handler: MessageHandler) => {
    messageHandlers.current.set(messageType, handler)
  }, [])

  const offMessage = useCallback((messageType: string) => {
    messageHandlers.current.delete(messageType)
  }, [])

  useEffect(() => {
    const existingBot = loadBotFromSession();

    if (existingBot) {
      setCurrentBot(existingBot);
    } else {
      const newBot = generateRandomBot();
      setCurrentBot(newBot);
      saveBotToSession(newBot);
    }
  }, []);

  useEffect(() => {
    if (currentBot) {
      connectWebSocket()
    }

    return () => {
      disconnectWebSocket()
    }
  }, [currentBot, connectWebSocket, disconnectWebSocket])

  return (
    <BotsContext.Provider value={{
      currentBot,
      connectionStatus,
      sendWebSocketMessage,
      onMessage,
      offMessage,
    }}>
      {children}
    </BotsContext.Provider>
  )
}

export function useBots() {
  const context = useContext(BotsContext)
  if (context === undefined) {
    throw new Error('useBots must be used within a BotsProvider')
  }
  return context
}
