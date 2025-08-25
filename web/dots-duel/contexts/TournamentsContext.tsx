"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Tournament } from '@/types/Tournament'

interface TournamentsContextType {
  tournaments: Tournament[]
  currentTournament: Tournament | null
  setCurrentTournament: React.Dispatch<React.SetStateAction<Tournament | null>>
  setTournaments: React.Dispatch<React.SetStateAction<Tournament[]>>
}

const TournamentsContext = createContext<TournamentsContextType | undefined>(undefined)

export function TournamentsProvider({ children }: { children: ReactNode }) {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null)

  return (
    <TournamentsContext.Provider value={{
      tournaments,
      setTournaments,
      currentTournament,
      setCurrentTournament
    }}>
      {children}
    </TournamentsContext.Provider>
  )
}

export function useTournaments() {
  const context = useContext(TournamentsContext)
  if (context === undefined) {
    throw new Error('useTournaments must be used within a TournamentsProvider')
  }
  return context
}
