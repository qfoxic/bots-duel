'use client'
import { Bot } from '@/types/Bot'
import { useEffect } from 'react'

interface BotPanelProps {
  leftBot: Bot;
  rightBot: Bot | null;
  currentPlayer: Bot | null;
}

export function BotPanel({ leftBot, rightBot, currentPlayer }: BotPanelProps) {

  useEffect(() => {}, [currentPlayer])

  return (
    <div className="w-full bg-gray-800 text-white p-4 shadow-lg">
      <div className="flex justify-between items-center max-w-6xl mx-auto">
        {/* Left Bot */}
        <div className="flex flex-col items-start">
          <div className={`text-lg font-bold ${currentPlayer?.id === leftBot.id ? 'text-red-400 animate-pulse' : 'text-red-300'}`}>
            {leftBot.id}
            {currentPlayer?.id === leftBot.id && (
              <span className="ml-2 text-sm">turn</span>
            )}
          </div>
        </div>
        {/* Right Bot */}
        <div className="flex flex-col items-end">
          <div className={`text-lg font-bold ${currentPlayer?.id === rightBot?.id ? 'text-blue-400 animate-pulse' : 'text-blue-300'}`}>
            {rightBot ? rightBot.id : 'waiting...'}
            {currentPlayer?.id === rightBot?.id && (
              <span className="ml-2 text-sm">turn</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
