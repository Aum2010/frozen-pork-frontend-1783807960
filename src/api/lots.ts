import client from './client'
import type { Lot, LotStatus } from '../types'

export const lotsApi = {
  getAll: async (status?: LotStatus) => {
    const res = await client.get<Lot[]>('/lots', { params: status ? { status } : {} })
    return res.data
  },
  getOne: async (id: string) => {
    const res = await client.get<Lot>(`/lots/${id}`)
    return res.data
  },
  create: async (data: { lotNumber: string; supplier: string; weightKg: number; receivedAt: string }) => {
    const res = await client.post<Lot>('/lots', data)
    return res.data
  },
  assignZone: async (id: string, zone: string) => {
    const res = await client.patch<Lot>(`/lots/${id}/zone`, { zone })
    return res.data
  },
}