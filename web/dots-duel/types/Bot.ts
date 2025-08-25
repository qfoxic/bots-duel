export enum BotType {
  AUTO = 'auto',
  MANUAL = 'manual'
}

export interface Bot {
  id: string
  type: BotType
}
