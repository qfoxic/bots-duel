'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Tournament, GRID_COLS, GRID_ROWS, TournamentStatus } from '@/types/Tournament'
import { BotType } from '@/types/Bot'
import { useBots } from '@/contexts/BotsContext'
import { useTournaments } from '@/contexts/TournamentsContext'
import { TournamentCard } from '@/components/TournamentCard'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { Section } from '@/components/Section'


export default function Home() {
  const { currentBot, connectionStatus, setCurrentBot, sendWebSocketMessage, onMessage, saveBotToSession } = useBots();
  const { tournaments, setTournaments, currentTournament, setCurrentTournament } = useTournaments();
  const router = useRouter()

  const handleJoinTournament = (tournament: Tournament) => {
    if (!currentBot)
      return;

    setCurrentTournament(tournament);

    sendWebSocketMessage({
      type: 'JoinTournament',
      tournament: {
        ...tournament,
        bot: currentBot
      }
    });
    router.push(`/match`);
  }

  const handleCreateTournament = () => {
    if (!currentBot)
      return;

    const tournamentData: Tournament = {
      id: Math.random().toString().substring(2, 10),
      owner: currentBot, // Set the current bot as the owner
      bot: currentBot,
      status: TournamentStatus.UPCOMING,
      participants: [currentBot.id],
      dims: [GRID_ROWS, GRID_COLS]
    }

    setCurrentTournament(tournamentData);
    setTournaments(prev => {
      return [...prev, tournamentData];
    });
    sendWebSocketMessage({
      type: 'CreateTournament',
      tournament: tournamentData
    });
  }

  const handleSetBotType = (bt: BotType) => {
    if (!currentBot) return;
    currentBot.type = bt;
    saveBotToSession(currentBot);
    setCurrentBot({ ...currentBot });
  };

  useEffect(() => {
    const unjoin = onMessage('JoinTournament', (message) => {
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
    });
    const uncreate = onMessage('CreateTournament', (message) => {
      setTournaments(prev => {
        return [...prev, message.tournament];
      });
    });

    return () => {
      unjoin();
      uncreate();
    }
  }, [onMessage, setTournaments])


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Current Bot Header */}
        {currentBot && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-800 truncate">{currentBot.id} <span><ConnectionStatus status={connectionStatus} /></span></h2>
                <div className="mt-1 flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="inline-flex rounded-md border border-gray-300 bg-white">
                      <button
                        type="button"
                        onClick={() => handleSetBotType(BotType.MANUAL)}
                        className={`px-2.5 py-1 text-xs transition ${currentBot.type === BotType.MANUAL
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        manual bot
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetBotType(BotType.AUTO)}
                        className={`px-2.5 py-1 text-xs transition border-l border-gray-300 ${currentBot.type === BotType.AUTO
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        auto bot
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCreateTournament}
                disabled={!!currentTournament}
                className={`px-4 py-2 font-semibold rounded-lg transition-colors ${!currentTournament
                  ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  }`}
              >
                Create Tournament
              </button>
            </div>
          </div>
        )}

        <Section title="Tournaments" color="bg-green-500">
          {tournaments.map((tournament: Tournament) => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              currentBot={currentBot}
              onJoin={handleJoinTournament}
            />
          ))}
        </Section>
      </div>
    </div>
  )
}
