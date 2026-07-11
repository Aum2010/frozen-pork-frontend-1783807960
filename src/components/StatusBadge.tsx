import type { LotStatus, TankStatus , ThawStatus } from '../types'

const LOT_STATUS: Record<LotStatus, { label: string; className: string }> = {
  IN_FREEZER:        { label: 'ในตู้แช่', className: 'bg-blue-100 text-blue-800' },
  PARTIALLY_THAWING: { label: 'ละลายบางส่วน', className: 'bg-yellow-100 text-yellow-800' },
  FULLY_THAWING:     { label: 'ละลายทั้งหมด', className: 'bg-orange-100 text-orange-800' },
  USED:              { label: 'ใช้แล้ว', className: 'bg-gray-100 text-gray-600' },
}
const THAW_STATUS: Record<ThawStatus, { label: string; className: string }> = {
  THAWING:      { label: 'กำลังละลาย', className: 'bg-yellow-100 text-yellow-800' },
  WAITING_TANK: { label: 'รอเข้าถัง', className: 'bg-orange-100 text-orange-800' },
  IN_TANK:      { label: 'อยู่ในถัง', className: 'bg-green-100 text-green-800' },
  USED:         { label: 'ใช้แล้ว', className: 'bg-gray-100 text-gray-600' },
}

const TANK_STATUS: Record<TankStatus, { label: string; className: string }> = {
  EMPTY: { label: 'ว่าง', className: 'bg-gray-100 text-gray-600' },
  IN_USE: { label: 'มีหมู', className: 'bg-blue-100 text-blue-800' },
  READY: { label: 'พร้อม', className: 'bg-green-100 text-green-800' },
}

export function LotStatusBadge({ status }: { status: LotStatus }) {
  const s = LOT_STATUS[status]
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.className}`}>{s.label}</span>
}

export function TankStatusBadge({ status }: { status: TankStatus }) {
  const s = TANK_STATUS[status]
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.className}`}>{s.label}</span>
}

export function ThawStatusBadge({ status }: { status: ThawStatus }) {
  const s = THAW_STATUS[status]
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.className}`}>{s.label}</span>
}