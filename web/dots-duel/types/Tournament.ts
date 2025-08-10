import { Bot } from './Bot';

export type Tournament = {
  id: string;
  bot: Bot;
  status: 'upcoming' | 'active' | 'completed';
  participants: string[];
  maxParticipants: number;
};
