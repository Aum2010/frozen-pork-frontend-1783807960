import client from './client'
import type { ThawEvent } from '../types'

export const thawApi = {
  start: async (lotId: string, weightKg: number) => {
    const res = await client.post<ThawEvent>('/thaw', { lotId, weightKg })
    return res.data
  },
  getPending: async () => {
    const res = await client.get<ThawEvent[]>('/thaw/pending')
    return res.data
  },
  confirmReady: async (id: string) => {
    const res = await client.post<ThawEvent>(`/thaw/${id}/confirm-ready`)
    return res.data
  },
  getWaitingTank: async () => {
    const res = await client.get<ThawEvent[]>('/thaw/waiting-tank')
    return res.data
  },
  startAuto: async (totalWeightKg: number) => {
    const res = await client.post('/thaw/auto', { totalWeightKg })
    return res.data
  },
}