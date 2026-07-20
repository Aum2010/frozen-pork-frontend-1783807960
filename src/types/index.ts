export type Role = 'WAREHOUSE' | 'PRODUCTION' | 'MANAGER' | 'ADMIN'

export type LotStatus = 'IN_FREEZER' | 'PARTIALLY_THAWING' | 'FULLY_THAWING' | 'USED'

export type TankStatus = 'EMPTY' | 'IN_USE' | 'READY'

export type EventType = 'RECEIVE' | 'ASSIGN_ZONE' | 'START_THAW' | 'ENTER_TANK' | 'WITHDRAW' | 'REORDER_ALERT'

export type ThawStatus = 'THAWING' | 'WAITING_TANK' | 'IN_TANK' | 'USED'

export interface User {
  id: string
  email: string
  name: string
  role: Role
}

export interface Lot {
  id: string
  lotNumber: string
  batchId: string
  supplier: string
  weightKg: number
  remainingKg: number
  zone: string | null
  status: LotStatus
  receivedAt: string
  createdAt: string
  thawEvents?: ThawEvent[]
  expiryDate: string | null
}

export interface ThawEvent {
  id: string
  lotId: string
  weightKg: number
  remainingKg: number
  startedAt: string
  readyAt: string
  status: ThawStatus
  remainingMinutes?: number
  isOverdue?: boolean
  lot?: Lot
}

export interface Tank {
  id: string
  tankNumber: number
  capacityKg: number
  currentWeightKg: number
  status: TankStatus
  isFifoNext?: boolean
  tankEntries?: TankEntry[]
}

export interface TankEntry {
  id: string
  tankId: string
  thawEventId: string
  weightKg: number
  filledAt: string
  emptyAt: string | null
  thawEvent?: {
    lot?: Lot
  }
  tank?: Tank
}

export interface Ledger {
  id: string
  eventType: EventType
  lotId: string | null
  weightKg: number
  actorId: string
  productionOrder: string | null
  note: string | null
  createdAt: string
  lot?: Lot
}

export interface AdvisoryStatus {
  hasAlert: boolean
  reorder: {
    shouldReorder: boolean
    totalStockKg: number
    daysLeft: number
    recommendedOrderKg: number
    message: string
  }
  thaw: {
    shouldThaw: boolean
    thawingKg: number
    recommendedWeightKg: number
    message: string
  }
  tankReady: {
    readyCount: number
    message: string
  }
  expiry?: {
    expiredCount: number
    warningCount: number
    expired: Lot[]
    warning: Lot[]
    message: string
  }
}