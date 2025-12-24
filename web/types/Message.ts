import { Tournament } from "./Tournament"
import { Coord } from "./Coord"

export enum Result {
  WIN = 1,
  LOSS = -1,
  DRAW = 0
};

export enum Winner {
  ME = 'me',
  OPP = 'opp',
  DRAW = 'draw',
}

export type GameResolution = {
  me: number,
  opp: number,
  winner: Winner | null
};

export type JoinTournamentEvent = {
  type: 'JoinTournament'
  tournament: Tournament
};

export type CreateTournamentEvent = {
  type: 'CreateTournament'
  tournament: Tournament
};

export type NotifyTournamentEvent = {
  type: 'NotifyTournament'
  tournament: Tournament
};

export type TournamentMoveDoneEvent = {
  type: 'TournamentMoveDone'
  tournament: Tournament
  move: Coord
  grid?: number[]
  resolution?: GameResolution
};

export type TournamentFinishedEvent = {
  type: 'TournamentFinished'
  tournament: Tournament
};

export type TournamentAskForCoordEvent = {
  type: 'TournamentAskForCoord'
  tournament: Tournament,
  coord?: Coord
};

export type TournamentTrainBotEvent = {
  type: 'TournamentTrainBot'
  tournament: Tournament
  winner: Winner
};

export type JoinSelfTournamentEvent = {
  type: 'JoinSelfTournament'
  tournament: Tournament
};

export type TournamentSelfMoveDoneEvent = {
  type: 'TournamentSelfMoveDone'
  tournament: Tournament
  move: Coord
  grid?: number[]
  resolution?: GameResolution
};

export type TournamentEvents = (
  JoinTournamentEvent | CreateTournamentEvent | NotifyTournamentEvent |
  TournamentMoveDoneEvent | TournamentFinishedEvent | TournamentAskForCoordEvent | TournamentTrainBotEvent | JoinSelfTournamentEvent | TournamentSelfMoveDoneEvent
);

export type EventType = TournamentEvents['type'];
