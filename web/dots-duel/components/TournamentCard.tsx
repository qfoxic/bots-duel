'use client'
import { Tournament } from '@/types/Tournament'
import { Bot } from '@/types/Bot'

interface TournamentCardProps {
  tournament: Tournament
  currentBot: Bot | null
  onJoin: (tournament: Tournament) => void
}

const statusColors = {
  active: 'bg-green-100 text-green-800',
  upcoming: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-100 text-gray-800',
} as const

export const TournamentCard = ({ tournament, currentBot, onJoin }: TournamentCardProps) => {
  const { status } = tournament
  const canJoin = currentBot && status === 'upcoming'

  return (
    <div className="px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="text-lg font-semibold text-gray-800">{tournament.owner.id}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
            {status}
          </span>
          {canJoin && (
            <button
              onClick={() => onJoin(tournament)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Join
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
