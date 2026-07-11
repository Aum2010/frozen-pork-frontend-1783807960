import { useState, useEffect } from 'react'
import { thawApi } from '../api/thaw'
import { lotsApi } from '../api/lots'
import type { ThawEvent, Lot } from '../types'
import toast from 'react-hot-toast'

export default function ThawPage() {
  const [pending, setPending] = useState<ThawEvent[]>([])
  const [lots, setLots] = useState<Lot[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [totalWeightKg, setTotalWeightKg] = useState('')
  const [preview, setPreview] = useState<{ lot: string; weightKg: number }[]>([])

  const load = async () => {
    try {
      const [p, inFreezer, partialThawing] = await Promise.all([
        thawApi.getPending(),
        lotsApi.getAll('IN_FREEZER'),
        lotsApi.getAll('PARTIALLY_THAWING'),
      ])
      setPending(p)
      setLots([...inFreezer, ...partialThawing])
    } catch {
      toast.error('โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // คำนวณ preview ว่าจะแบ่ง lot ยังไง
  const calcPreview = (weight: number) => {
    let remaining = weight
    const result = []
    for (const lot of lots) {
      if (remaining <= 0) break
      const take = Math.min(lot.remainingKg, remaining)
      result.push({ lot: lot.lotNumber, weightKg: take })
      remaining -= take
    }
    setPreview(result)
  }
  const handleAutoThaw = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await thawApi.startAuto(Number(totalWeightKg))
      toast.success(`เริ่มละลายสำเร็จ — ${res.plan.length} lot`)
      setTotalWeightKg('')
      setPreview([])
      load()
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'เกิดข้อผิดพลาด')
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirm = async (id: string) => {
    try {
      await thawApi.confirmReady(id)
      toast.success('ยืนยันสำเร็จ — หมูรอเข้าถังแล้ว')
      load()
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'เกิดข้อผิดพลาด')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800">🌡️ จัดการละลายน้ำแข็ง</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-700 mb-4">เริ่มละลาย (Auto FIFO)</h2>
        <form onSubmit={handleAutoThaw} className="space-y-4">

          {/* สต็อกรวม */}
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
            สต็อกคงเหลือทั้งหมด: <strong>{lots.reduce((s, l) => s + l.remainingKg, 0).toLocaleString()} กก.</strong>
            {' '}({lots.length} lot)
          </div>

          <div className="flex gap-3 items-end">
            <div className="w-56">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                น้ำหนักรวมที่ต้องการละลาย (กก.)
              </label>
              <input
                type="number"
                value={totalWeightKg}
                onChange={(e) => {
                  setTotalWeightKg(e.target.value)
                  if (e.target.value) calcPreview(Number(e.target.value))
                  else setPreview([])
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="เช่น 800"
                min={1}
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !totalWeightKg}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'กำลังบันทึก...' : 'เริ่มละลาย'}
            </button>
          </div>

          {/* Preview plan */}
          {preview.length > 0 && (
            <div className="border border-blue-100 rounded-lg p-3 bg-blue-50">
              <p className="text-xs font-semibold text-blue-700 mb-2">
                📋 ระบบจะแบ่งดังนี้ (FIFO)
              </p>
              <div className="space-y-1">
                {preview.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-800 text-xs flex items-center justify-center">{i + 1}</span>
                    <span className="font-medium text-blue-800">{p.lot}</span>
                    <span className="text-blue-600">→ {p.weightKg.toLocaleString()} กก.</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-blue-200 text-xs text-blue-600">
                รวม: {preview.reduce((s, p) => s + p.weightKg, 0).toLocaleString()} กก.
                {preview.reduce((s, p) => s + p.weightKg, 0) < Number(totalWeightKg) && (
                  <span className="text-red-500 ml-2">⚠️ สต็อกไม่พอ</span>
                )}
              </div>
            </div>
          )}

        </form>
      </div>

      {/* Pending List */}
      <div>
        <h2 className="font-semibold text-gray-700 mb-3">กำลังละลายอยู่ ({pending.length} รายการ)</h2>
        {loading ? (
          <p className="text-gray-400 text-sm">กำลังโหลด...</p>
        ) : pending.length === 0 ? (
          <p className="text-gray-400 text-sm">ไม่มีรายการกำลังละลาย</p>
        ) : (
          <div className="grid gap-3">
            {pending.map((event) => (
              <div key={event.id} className={`bg-white rounded-lg border p-4 flex items-center justify-between ${event.isOverdue ? 'border-green-300' : 'border-gray-200'}`}>
                <div>
                  <p className="font-medium text-gray-800">{event.lot?.lotNumber ?? event.lotId}</p>
                  <p className="text-sm text-gray-500">{event.weightKg.toLocaleString()} กก.</p>
                  <p className="text-xs text-gray-400 mt-1">
                    พร้อมเวลา: {new Date(event.readyAt).toLocaleString('th-TH')}
                  </p>
                </div>
                <div className="text-right">
                  {event.isOverdue ? (
                    <div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full block mb-2">
                        ✅ พร้อมแล้ว
                      </span>
                      <button
                        onClick={() => handleConfirm(event.id)}
                        className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700"
                      >
                        ยืนยันเข้าถัง
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-yellow-600 font-medium">
                      ⏳ อีก {event.remainingMinutes} นาที
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}