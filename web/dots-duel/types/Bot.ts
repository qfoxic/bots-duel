export interface Bot {
  id: string
  type: 'auto' | 'manual'
  wins: number
  losses: number
  rating: number
  status: 'active' | 'inactive'
}
