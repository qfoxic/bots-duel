import { Bot } from './Bot';

export enum TournamentStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  COMPLETED = 'completed'
};


export type Tournament = {
  id: string;
  owner: Bot; // Added owner field to track who created the tournament
  bot: Bot;
  status: TournamentStatus;
  participants: string[];
  dims: [number, number];
};

export const GRID_ROWS = 30;
export const GRID_COLS = 30;
