'use client'
import { useEffect, useState, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { BotPanel } from '@/components/BotPanel'
import { Bot } from '@/types/Bot'
import { useBots } from '@/contexts/BotsContext'
import { JoinTournamentEvent, TournamentEvents } from '@/types/Message'
import { useTournaments } from '@/contexts/TournamentsContext'


const GameDashboard = dynamic(() => import('@/components/GameDashboard').then(mod => ({ default: mod.GameDashboard })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full"><div className="text-xl text-gray-600">Loading game board...</div></div>
})

function MatchContent() {
  const { currentBot, onMessage, offMessage } = useBots()
  const { currentTournament, currentPlayer } = useTournaments()
  const [ opponent, setOpponent] = useState<Bot|null>(null)

  useEffect(() => {
    onMessage('JoinTournament', ((message: JoinTournamentEvent) => {
      if (!currentTournament) return;
      setOpponent(message.tournament.bot)
    }) as unknown as (m: TournamentEvents) => void);

    if(currentBot?.id !== currentPlayer?.id) {
      setOpponent(currentPlayer)
    }

    return () => {
      offMessage('JoinTournament')
    }
  }, [onMessage, offMessage, opponent, currentTournament, currentPlayer, currentBot])

  if (!currentBot) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <BotPanel
        leftBot={currentBot}
        rightBot={opponent}
        currentPlayer={currentPlayer}
      />
      <div className="h-[calc(100vh-80px)]">
        <GameDashboard
          currentBot={currentBot}
          opponentBot={opponent}
          currentPlayer={currentPlayer}
        />
      </div>
    </div>
  )
}

export default function MatchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    }>
      <MatchContent />
    </Suspense>
  )
}

// TODO. Also we have to send information that tournament status was changed with websockets
// TODO. Later think on amount of users, how to handle large amounts
// TODO. Later think on amount of tournaments how to handle large amount of tournaments
