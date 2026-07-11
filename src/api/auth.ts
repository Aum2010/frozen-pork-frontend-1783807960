import client from './client'
import type { User } from '../types'


export const authApi = {
  login: async (email: string, password: string) => {
    const res = await client.post<{ access_token: string; user: User }>('/auth/login', { email, password })
    return res.data
  },
  me: async () => {
    const res = await client.get<User>('/auth/me')
    return res.data
  },
}