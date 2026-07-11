import { useState, useEffect } from 'react'
import { lotsApi } from '../api/lots'
import type { Lot } from '../types'
import { LotStatusBadge, ThawStatusBadge } from '../components/StatusBadge'
import toast from 'react-hot-toast'

export default function ReceivePage() {
  const [lots, setLots] = useState<Lot[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState({
    lotNumber: '',
    supplier: '',
    weightKg: '',
    receivedAt: new Date().toISOString().slice(0, 10),
  })
  const [zoneInputs, setZoneInputs] = useState<Record<string, string>>({})

  const ZONES = [
    'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8',
    'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8',
  ]

  const fillPreset = () => {
    setForm({
      lotNumber: `LOT-${Date.now()}`,
      supplier: 'ฟาร์มไทย',
      weightKg: '4000',
      receivedAt: new Date().toISOString().slice(0, 10),
    })
    setShowForm(true)
  }

  const load = async () => {
    try {
      const data = await lotsApi.getAll()
      setLots(data)
    } catch {
      toast.error('โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await lotsApi.create({ ...form, weightKg: Number(form.weightKg) })
      toast.success('รับสินค้าเข้าระบบสำเร็จ')
      setForm({ lotNumber: '', supplier: '', weightKg: '', receivedAt: new Date().toISOString().slice(0, 10) })
      setShowForm(false)
      load()
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'เกิดข้อผิดพลาด')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAssignZone = async (id: string) => {
    const zone = zoneInputs[id]
    if (!zone) return toast.error('กรุณาระบุ zone')
    try {
      await lotsApi.assignZone(id, zone)
      toast.success('ระบุ zone สำเร็จ')
      load()
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'เกิดข้อผิดพลาด')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">🚛 รับสินค้าเข้าระบบ</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + รับสินค้าใหม่
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={fillPreset}
          className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-200"
        >
          🤖 Bot Fill
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-700 mb-4">บันทึกการรับสินค้า</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lot Number</label>
              <input
                value={form.lotNumber}
                onChange={(e) => setForm({ ...form, lotNumber: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="LOT-2026-001"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <input
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ฟาร์มไทย"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">น้ำหนัก (กก.)</label>
              <input
                type="number"
                value={form.weightKg}
                onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="4000"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่รับ</label>
              <input
                type="date"
                value={form.receivedAt}
                onChange={(e) => setForm({ ...form, receivedAt: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg border">ยกเลิก</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lot List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['', 'Lot Number', 'Supplier', 'น้ำหนักรวม', 'คงเหลือ', 'Zone', 'Status', ''].map((h, i) => (
                <th key={i} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">กำลังโหลด...</td></tr>
            ) : lots.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">ยังไม่มีข้อมูล</td></tr>
            ) : lots.map((lot) => (
              <>
                {/* Main Row */}
                <tr
                  key={lot.id}
                  className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === lot.id ? null : lot.id)}
                >
                  <td className="px-4 py-3 text-gray-400">
                    {lot.thawEvents && lot.thawEvents.length > 0
                      ? expandedId === lot.id ? '▼' : '▶'
                      : ''}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{lot.lotNumber}</td>
                  <td className="px-4 py-3 text-gray-600">{lot.supplier}</td>
                  <td className="px-4 py-3 text-gray-600">{lot.weightKg.toLocaleString()} กก.</td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${lot.remainingKg === 0 ? 'text-gray-400' : 'text-blue-600'}`}>
                      {lot.remainingKg.toLocaleString()} กก.
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    {(lot.status === 'IN_FREEZER' || lot.status === 'PARTIALLY_THAWING') && (
                      <div className="flex gap-2">
                        <select
                          value={zoneInputs[lot.id] ?? lot.zone ?? ''}
                          onChange={(e) => setZoneInputs({ ...zoneInputs, [lot.id]: e.target.value })}
                          className="border border-gray-300 rounded px-2 py-1 text-xs w-20"
                        >
                          <option value="">-- Zone --</option>
                          {ZONES.map((z) => (
                            <option key={z} value={z}>{z}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleAssignZone(lot.id)}
                          className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                        >
                          {lot.zone ? 'แก้ไข' : 'ระบุ'}
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3"><LotStatusBadge status={lot.status} /></td>
                </tr>

                {/* Expand Row — ThawEvents */}
                {expandedId === lot.id && lot.thawEvents && lot.thawEvents.length > 0 && (
                  <tr key={`${lot.id}-expand`} className="bg-blue-50 border-t border-blue-100">
                    <td colSpan={8} className="px-8 py-3">
                      <p className="text-xs font-semibold text-gray-500 mb-2">
                        รายการละลาย ({lot.thawEvents.length} รายการ)
                      </p>
                      <div className="space-y-2">
                        {lot.thawEvents.map((thaw) => (
                          <div
                            key={thaw.id}
                            className="flex items-center gap-4 bg-white rounded-lg border border-blue-100 px-4 py-2 text-xs"
                          >
                            <span className="text-gray-500 w-32 shrink-0">
                              {new Date(thaw.startedAt).toLocaleString('th-TH')}
                            </span>
                            <span className="font-medium text-gray-800 w-24 shrink-0">
                              {thaw.weightKg.toLocaleString()} กก.
                            </span>
                            <ThawStatusBadge status={thaw.status} />
                            {thaw.status === 'THAWING' && (
                              <span className="text-yellow-600">
                                พร้อม: {new Date(thaw.readyAt).toLocaleString('th-TH')}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>คงเหลือในตู้แช่</span>
                          <span>{lot.remainingKg} / {lot.weightKg} กก.</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${(lot.remainingKg / lot.weightKg) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}