import client from './client'
import type { AdvisoryStatus } from '../types'

export const advisoryApi = {
  getStatus: async () => {
    const res = await client.get<AdvisoryStatus>('/advisory/status')
    return res.data
  },
}