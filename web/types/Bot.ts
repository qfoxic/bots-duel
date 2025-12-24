export enum BotType {
  AUTO = 'auto',
  MANUAL = 'manual',
  SELF = 'self'
}

export interface Bot {
  id: string
  type: BotType
}
