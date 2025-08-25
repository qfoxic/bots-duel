'use client'
import dynamic from 'next/dynamic'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTournaments } from '@/contexts/TournamentsContext'
import { TournamentStatus } from '@/types/Tournament'
import { useBots } from '@/contexts/BotsContext'

const GameDashboard = dynamic(
  () => import('@/components/GameDashboard').then(mod => ({ default: mod.GameDashboard })),
  { ssr: false, loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-xl text-gray-600">Loading game board...</div>
      </div>
    )
  }
)

export default function MatchPage() {
  const { currentTournament } = useTournaments();
  const { currentBot } = useBots();
  const router = useRouter();

  const shouldLeave = !currentTournament || !currentBot || currentTournament.status === TournamentStatus.COMPLETED

  useEffect(() => {
    if (shouldLeave) router.replace('/')
  }, [shouldLeave, router])

  if (shouldLeave) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <GameDashboard initialTournament={currentTournament} currentBot={currentBot} />
    </div>
  )
}
