import { useState, useEffect } from 'react'
import { tanksApi } from '../api/tanks'
import { thawApi } from '../api/thaw'
import type { Tank, ThawEvent } from '../types'
import { TankStatusBadge } from '../components/StatusBadge'
import toast from 'react-hot-toast'

function TankCard({ tank, onFill, hasWaiting }: {
  tank: Tank
  onFill: () => void
  hasWaiting: boolean
}) {
  const pct = (tank.currentWeightKg / tank.capacityKg) * 100
  const activeEntry = tank.tankEntries?.[0]
  const lot = activeEntry?.thawEvent?.lot
  const filledAt = activeEntry?.filledAt

  return (
    <div className={`bg-white rounded-xl border-2 p-4 ${tank.isFifoNext ? 'border-orange-400' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-gray-800">ถัง {tank.tankNumber}</span>
        {tank.isFifoNext && (
          <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">
            FIFO
          </span>
        )}
      </div>

      <TankStatusBadge status={tank.status} />

      {/* Lot Number + วันที่ */}
      {lot && (
        <div className="mt-2 space-y-0.5">
          <p className="text-xs font-medium text-gray-700">{lot.lotNumber}</p>
          <p className="text-xs text-gray-400">
            {lot.batchId}
          </p>
          {filledAt && (
            <p className="text-xs text-gray-400">
              เข้าถัง: {new Date(filledAt).toLocaleString('th-TH')}
            </p>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div className="mt-2">
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
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