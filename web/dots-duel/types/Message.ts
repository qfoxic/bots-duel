import { Tournament } from "./Tournament"

export type JoinTournamentEvent = {
  type: 'JoinTournament'
  tournament: Tournament
}

export type CreateTournamentEvent = {
  type: 'CreateTournament'
  tournament: Tournament
}

export type NotifyTournamentEvent = {
  type: 'NotifyTournament'
  tournament: Tournament
}

export type TournamentEvents = JoinTournamentEvent | CreateTournamentEvent | NotifyTournamentEvent;
