import client from './client'
import type { Tank } from '../types'

export const tanksApi = {
  getAll: async () => {
    const res = await client.get<Tank[]>('/tanks')
    return res.data
  },
  getFifoSuggest: async () => {
    const res = await client.get<Tank>('/tanks/fifo-suggest')
    return res.data
  },
  fill: async (tankId: string, thawEventId: string, weightKg: number) => {
    const res = await client.post(`/tanks/${tankId}/fill`, { thawEventId, weightKg })
    return res.data
  },
  withdraw: async (tankId: string, productionOrder: string, weightKg: number) => {
    const res = await client.post(`/tanks/${tankId}/withdraw`, { productionOrder, weightKg })
    return res.data
  },
  withdrawAuto: async (productionOrder: string, weightKg: number) => {
    const res = await client.post('/tanks/withdraw-auto', { productionOrder, weightKg })
    return res.data
  },
}