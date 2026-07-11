import client from './client'
import type { Ledger } from '../types'

export const ledgerApi = {
  getAll: async (params?: { lotId?: string; eventType?: string }) => {
    const res = await client.get<Ledger[]>('/ledger', { params })
    return res.data
  },
  getTimeline: async (lotId: string) => {
    const res = await client.get(`/ledger/lot/${lotId}/timeline`)
    return res.data
  },
  exportCsv: async () => {
    const res = await client.get('/ledger/export', { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = `ledger-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  },
}