'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Tournament } from '@/types/Tournament'
import { useBots } from '@/contexts/BotsContext'
import { useTournaments } from '@/contexts/TournamentsContext'
import { TournamentCard } from '@/components/TournamentCard'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { Section } from '@/components/Section'
import { TournamentEvents, NotifyTournamentEvent, CreateTournamentEvent } from '@/types/Message'


export default function Home() {
  const { currentBot, connectionStatus, sendWebSocketMessage, onMessage, offMessage } = useBots()
  const { tournaments, setTournaments, currentTournament, setCurrentTournament, setCurrentPlayer } = useTournaments()
  const router = useRouter()

  const handleJoinTournament = (tournament: Tournament) => {
    if (!currentBot) return;

    setCurrentTournament(tournament);
    setCurrentPlayer(tournament.bot);
    sendWebSocketMessage({
      type: 'JoinTournament',
      tournament: {
        ...tournament,
        bot: currentBot
      }
    });
    router.push(`/match/${tournament.id}`);
  }

  const handleCreateTournament = () => {
    if (!currentBot) return;
    if (currentTournament) return;

    const tournamentData: Tournament = {
      id: Math.random().toString().substring(2, 10),
      bot: currentBot,
      status: 'upcoming' as const,
      participants: [currentBot.id],
      maxParticipants: 2
    }

    setCurrentTournament(tournamentData);
    setCurrentPlayer(currentBot);
    sendWebSocketMessage({
      type: 'CreateTournament',
      tournament: tournamentData
    });
    router.push(`/match/${tournamentData.id}`);
  }

  useEffect(() => {
    onMessage('NotifyTournament', ((message: NotifyTournamentEvent) => {
      setTournaments(prev => {
        const existingIndex = prev.findIndex(t => t.id === message.tournament.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = message.tournament;
          return updated;
        } else {
          return [...prev, message.tournament];
        }
      });
    }) as unknown as (m: TournamentEvents) => void);

    onMessage('CreateTournament', ((message: CreateTournamentEvent) => {
      setTournaments(prev => {
        return [...prev, message.tournament];
      });
    }) as unknown as (m: TournamentEvents) => void);

    return () => {
      offMessage('NotifyTournament')
      offMessage('CreateTournament')
    }
  }, [onMessage, offMessage, setTournaments])


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Current Bot Header */}
        {currentBot && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {currentBot.id}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-800">{currentBot.id}</h2>
                <div className="flex space-x-4 text-sm text-gray-600">
                  <span>Type: {currentBot.type}</span>
                </div>
                <div className="mt-2">
                  <ConnectionStatus status={connectionStatus} />
                </div>
              </div>
              {currentBot && (
                <button
                  onClick={handleCreateTournament}
                  disabled={currentTournament !== null}
                  className={`px-4 py-2 font-semibold rounded-lg transition-colors ${
                    currentTournament === null
                      ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
                      : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  }`}
                >
                  Create Tournament
                </button>
              )}
            </div>
          </div>
        )}

        <Section title="Tournaments" color="bg-green-500">
          {
            tournaments.map((tournament: Tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                currentBot={currentBot}
                onJoin={handleJoinTournament}
              />
            ))
          }
        </Section>
      </div>
    </div>
  )
}
