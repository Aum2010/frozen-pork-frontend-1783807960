import { useState, useEffect } from 'react'
import { tanksApi } from '../api/tanks'
import { thawApi } from '../api/thaw'
import type { Tank, ThawEvent } from '../types'
import { TankStatusBadge } from '../components/StatusBadge'
import toast from 'react-hot-toast'

const getTimeInTank = (filledAt: string) => {
  const diff = Date.now() - new Date(filledAt).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) return `${days} วัน ${hours} ชม.`
  if (hours > 0) return `${hours} ชม. ${minutes} นาที`
  return `${minutes} นาที`
}

function TankCard({ tank, onFill, hasWaiting, maxDaysInTank, maxHoursInTank, maxMinutesInTank }: {
  tank: Tank
  onFill: () => void
  hasWaiting: boolean
  maxDaysInTank: number
  maxHoursInTank: number
  maxMinutesInTank: number
}) {
  const pct = (tank.currentWeightKg / tank.capacityKg) * 100
  const activeEntry = tank.tankEntries?.[0]
  const lot = activeEntry?.thawEvent?.lot
  const filledAt = activeEntry?.filledAt

  const diffMs = filledAt ? Date.now() - new Date(filledAt).getTime() : 0
  const thresholdMs = (maxDaysInTank * 24 * 60 + maxHoursInTank * 60 + maxMinutesInTank) * 60 * 1000
  const isOverdue = filledAt && thresholdMs > 0 ? diffMs >= thresholdMs : false

  // คำนวณจำนวนวันที่แช่ในถัง
  // const daysInTank = filledAt
  //   ? Math.floor((Date.now() - new Date(filledAt).getTime()) / (1000 * 60 * 60 * 24))
  //   : null

  // เช็คใกล้หมดอายุ
  const isExpired = lot?.expiryDate && new Date(lot.expiryDate) < new Date()
  const isExpiringSoon = lot?.expiryDate &&
    new Date(lot.expiryDate) >= new Date() &&
    new Date(lot.expiryDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  return (
    <div className={`bg-white rounded-xl border-2 p-4 ${isExpired ? 'border-red-400' :
      isOverdue ? 'border-yellow-400' :
        tank.isFifoNext ? 'border-orange-400' :
          'border-gray-200'
      }`}>
      <div className="mb-2">
        <span className="font-bold text-gray-800">ถัง {tank.tankNumber}</span>
        <div className="flex flex-wrap gap-1 mt-1">
          {isExpired && (
            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">❌ หมดอายุ</span>
          )}
          {isExpiringSoon && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">⚠️ ใกล้หมดอายุ</span>
          )}
          {isOverdue && !isExpired && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
              {/* ⏰ แช่นานเกิน {maxDaysInTank} วัน */}
              ⏰ แช่นานเกิน {maxMinutesInTank} นาที
            </span>
          )}
          {tank.isFifoNext && !isExpired && !isOverdue && (
            <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">FIFO</span>
          )}
        </div>
      </div>

      <TankStatusBadge status={tank.status} />

      {lot ? (
        <div className="mt-2 space-y-1 border-t border-gray-100 pt-2">
          <p className="text-xs font-semibold text-gray-800">{lot.lotNumber}</p>
          {filledAt && (
            <p className="text-xs text-gray-500">
              เข้าถัง: {new Date(filledAt).toLocaleString('th-TH')}
            </p>
          )}
          {filledAt && (
            <p className={`text-xs font-medium ${isOverdue ? 'text-yellow-600' : 'text-gray-500'}`}>
              แช่มาแล้ว: {getTimeInTank(filledAt)}
            </p>
          )}
          {lot.expiryDate && (
            <p className={`text-xs font-medium ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-gray-400'
              }`}>
              หมดอายุ: {new Date(lot.expiryDate).toLocaleDateString('th-TH')}
            </p>
          )}
        </div>
      ) : (
        tank.status === 'EMPTY' && (
          <p className="text-xs text-gray-300 mt-2">ว่าง</p>
        )
      )}

      <div className="mt-2">
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${isExpired ? 'bg-red-400' : isOverdue ? 'bg-yellow-400' : 'bg-blue-500'
              }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {tank.currentWeightKg}/{tank.capacityKg} กก.
        </p>
      </div>

      {tank.status === 'EMPTY' && hasWaiting && (
        <button
          onClick={onFill}
          className="mt-3 w-full text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 py-1.5 rounded-lg"
        >
          + ใส่หมู
        </button>
      )}
    </div>
  )
}

export default function TankDashboardPage() {
  const [tanks, setTanks] = useState<Tank[]>([])
  const [waitingThaws, setWaitingThaws] = useState<ThawEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [fillForm, setFillForm] = useState<{ tankId: string; thawEventId: string; weightKg: string } | null>(null)
  const [maxDaysInTank ] = useState(0)
  const [maxHoursInTank ] = useState(0)
  const [maxMinutesInTank ] = useState(30) // default 30 นาที

  const load = async () => {
    try {
      const [t, w] = await Promise.all([
        tanksApi.getAll(),
        thawApi.getWaitingTank(),
      ])
      setTanks(t)
      setWaitingThaws(w)
    } catch {
      toast.error('โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleFill = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fillForm) return

    try {
      await tanksApi.fill(fillForm.tankId, fillForm.thawEventId, Number(fillForm.weightKg))
      toast.success('ใส่หมูเข้าถังสำเร็จ')
      setFillForm(null)
      load()
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'เกิดข้อผิดพลาด')
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-500">กำลังโหลด...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800">🪣 ถังน้ำแข็ง</h1>

      {/* Waiting lots alert */}
      {waitingThaws.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="font-medium text-orange-800 mb-1">🔔 มีหมูรอเข้าถัง {waitingThaws.length} รายการ</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {waitingThaws.map((t) => (
              <span key={t.id} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                {t.lot?.lotNumber} ({t.weightKg} กก.)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tank Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {tanks.map((tank) => (
          <TankCard
            key={tank.id}
            tank={tank}
            hasWaiting={waitingThaws.length > 0}
            maxDaysInTank={maxDaysInTank}
            maxHoursInTank={maxHoursInTank}
            maxMinutesInTank={maxMinutesInTank}
            onFill={() => setFillForm({ tankId: tank.id, thawEventId: '', weightKg: '' })}
          />
        ))}
      </div>

      {/* Fill Modal */}
      {fillForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold text-gray-800 mb-4">ใส่หมูเข้าถัง</h2>
            <form onSubmit={handleFill} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เลือก Lot</label>
                <select
                  value={fillForm.thawEventId}
                  onChange={(e) => setFillForm({ ...fillForm, thawEventId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  required
                >
                  <option value="">-- เลือก --</option>
                  {waitingThaws.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.lot?.lotNumber} — {t.remainingKg} กก.
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">น้ำหนัก (กก.)</label>
                <input
                  type="number"
                  value={fillForm.weightKg}
                  onChange={(e) => setFillForm({ ...fillForm, weightKg: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="400"
                  required
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setFillForm(null)} className="px-4 py-2 text-sm text-gray-600 border rounded-lg">ยกเลิก</button>
                <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">ยืนยัน</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}