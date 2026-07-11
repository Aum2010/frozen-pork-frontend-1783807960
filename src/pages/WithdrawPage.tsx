import { useState, useEffect } from 'react'
import { tanksApi } from '../api/tanks'
import type { Tank } from '../types'
import toast from 'react-hot-toast'
import { ledgerApi } from '../api/ledger'

export default function WithdrawPage() {
  const [tanks, setTanks] = useState<Tank[]>([])
  const [fifo, _] = useState<Tank | null>(null)
  const [loading, setLoading] = useState(true)
  // const [form, setForm] = useState({ tankId: '', productionOrder: '', weightKg: '' })
  const [form, setForm] = useState({ productionOrder: '', weightKg: '' })
  const [submitting, setSubmitting] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [historyLimit, setHistoryLimit] = useState(5)
  const [totalAvailable, setTotalAvailable] = useState(0)
  const [preview, setPreview] = useState<{ tankNumber: number; weightKg: number }[]>([])

  const load = async () => {
    try {
      // const t = await tanksApi.getAll()
      // setTanks(t.filter((tk) => tk.status !== 'EMPTY'))
      // const f = await tanksApi.getFifoSuggest().catch(() => null)
      // setFifo(f)
      const h = await ledgerApi.getAll({ eventType: 'WITHDRAW' })
      setHistory(h)

      const t = await tanksApi.getAll()
      const active = t.filter((tk) => tk.status !== 'EMPTY')
      setTanks(active)
      setTotalAvailable(active.reduce((s, tk) => s + tk.currentWeightKg, 0))

    } catch {
      toast.error('โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const calcPreview = (weight: number) => {
    let remaining = weight
    const result: { tankNumber: number; weightKg: number }[] = []

    // เรียงถังตาม FIFO (isFifoNext ก่อน แล้วตามลำดับ)
    const sorted = [...tanks].sort((a, b) => {
      if (a.isFifoNext) return -1
      if (b.isFifoNext) return 1
      return 0
    })

    for (const tank of sorted) {
      if (remaining <= 0) break
      const take = Math.min(tank.currentWeightKg, remaining)
      result.push({ tankNumber: tank.tankNumber, weightKg: take })
      remaining -= take
    }
    setPreview(result)
  }

  const handleBotWithdraw = async () => {
    if (totalAvailable === 0) return toast.error('ไม่มีหมูในถัง')
    try {
      const po = `PO-BOT-${Date.now()}`
      const res = await tanksApi.withdrawAuto(po, totalAvailable)
      const planText = res.plan.map((p: any) => `ถัง ${p.tankNumber}: ${p.weightKg} กก.`).join(', ')
      toast.success(`🤖 Bot เบิกสำเร็จ ${po} — ${planText}`)
      load()
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'เกิดข้อผิดพลาด')
    }
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fifo) return toast.error('ไม่มีถังที่แนะนำ')
    setSubmitting(true)
    try {
      await tanksApi.withdraw(fifo.id, form.productionOrder, Number(form.weightKg))
      toast.success('เบิกสำเร็จ')
      setForm({ productionOrder: '', weightKg: '' })
      load()
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'เกิดข้อผิดพลาด')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-500">กำลังโหลด...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800">🏭 เบิกหมูเพื่อผลิต</h1>
      <button
        onClick={handleBotWithdraw}
        disabled={totalAvailable === 0}
        className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50"
      >
        🤖 Bot Withdraw (FIFO)
      </button>

      {/* แสดงสต็อกรวมในถัง */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
        <p className="text-xs text-orange-500 mb-1">⭐ ระบบจะเบิกตาม FIFO อัตโนมัติ</p>
        <p className="font-semibold text-orange-800">
          สต็อกในถังรวม: {totalAvailable.toLocaleString()} กก.
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          {tanks.map((t) => (
            <span key={t.id} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
              ถัง {t.tankNumber}: {t.currentWeightKg} กก.
              {t.isFifoNext ? ' ⭐' : ''}
            </span>
          ))}
        </div>
      </div>

      {preview.length > 0 && (
        <div className="border border-blue-100 rounded-lg p-3 bg-blue-50 mt-3">
          <p className="text-xs font-semibold text-blue-700 mb-2">
            📋 ระบบจะเบิกดังนี้ (FIFO)
          </p>
          <div className="space-y-1">
            {preview.map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-800 text-xs flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="font-medium text-blue-800">ถัง {p.tankNumber}</span>
                <span className="text-blue-600">→ {p.weightKg.toLocaleString()} กก.</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-blue-200 text-xs text-blue-600 flex justify-between">
            <span>รวม: {preview.reduce((s, p) => s + p.weightKg, 0).toLocaleString()} กก.</span>
            {preview.reduce((s, p) => s + p.weightKg, 0) < Number(form.weightKg) && (
              <span className="text-red-500">⚠️ สต็อกไม่พอ</span>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleWithdraw} className="flex gap-3 items-end">
        <div className="w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Production Order</label>
          <input
            value={form.productionOrder}
            onChange={(e) => setForm({ ...form, productionOrder: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="PO-2026-001"
            required
          />
        </div>
        <div className="w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            น้ำหนัก (กก.) — สูงสุด {totalAvailable}
          </label>
          <input
            type="number"
            value={form.weightKg}
            onChange={(e) => {
              setForm({ ...form, weightKg: e.target.value })
              if (e.target.value) calcPreview(Number(e.target.value))
              else setPreview([])
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={`สูงสุด ${totalAvailable} กก.`}
            max={totalAvailable}
            min={1}
            required
          />
        </div>
        <button
          type="submit"
          disabled={submitting || totalAvailable === 0}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'กำลังบันทึก...' : 'ยืนยันเบิก'}
        </button>
      </form>

      {/* ประวัติการเบิก */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-700">📋 ประวัติการเบิก</h2>
          <select
            value={historyLimit}
            onChange={(e) => setHistoryLimit(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-2 py-1 text-xs"
          >
            <option value={5}>5 รายการล่าสุด</option>
            <option value={10}>10 รายการล่าสุด</option>
            <option value={20}>20 รายการล่าสุด</option>
            <option value={999}>ทั้งหมด</option>
          </select>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['วันเวลา', 'Lot', 'น้ำหนัก', 'Production Order', 'หมายเหตุ'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-6 text-gray-400">ยังไม่มีประวัติ</td></tr>
              ) : [...history]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, historyLimit)
                .map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(r.createdAt).toLocaleString('th-TH')}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {r.lot?.lotNumber ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.weightKg.toLocaleString()} กก.
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.productionOrder ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {r.note ?? '-'}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}