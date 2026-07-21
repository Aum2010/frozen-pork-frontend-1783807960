import { useState, useEffect } from 'react'
import { ledgerApi } from '../api/ledger'
import { lotsApi } from '../api/lots'
import type { Lot } from '../types'
import { LotStatusBadge } from '../components/StatusBadge'
import toast from 'react-hot-toast'

const STEP_ICONS: Record<string, string> = {
  RECEIVE: '🚛',
  ASSIGN_ZONE: '❄️',
  START_THAW: '🌡️',
  ENTER_TANK: '🪣',
  WITHDRAW: '🏭',
}

const STATUS_OPTIONS = [
  { value: '', label: 'ทุกสถานะ' },
  { value: 'IN_FREEZER', label: 'ในตู้แช่' },
  { value: 'PARTIALLY_THAWING', label: 'ละลายบางส่วน' },
  { value: 'FULLY_THAWING', label: 'ละลายทั้งหมด' },
  { value: 'USED', label: 'ใช้แล้ว' },
]

const ZONE_OPTIONS = [
  'ทุก Zone', 'A1','A2','A3','A4','A5','A6','A7','A8',
  'B1','B2','B3','B4','B5','B6','B7','B8',
]

export default function TraceabilityPage() {
  const [lots, setLots] = useState<Lot[]>([])
  const [filtered, setFiltered] = useState<Lot[]>([])
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null)
  const [timeline, setTimeline] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  // filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [zoneFilter, setZoneFilter] = useState('ทุก Zone')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const load = async () => {
    try {
      const data = await lotsApi.getAll()
      setLots(data)
      setFiltered(data)
    } catch {
      toast.error('โหลดไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // filter logic
  useEffect(() => {
    let result = [...lots]

    if (search) {
      result = result.filter((l) =>
        l.lotNumber.toLowerCase().includes(search.toLowerCase()) ||
        l.batchId.toLowerCase().includes(search.toLowerCase()) ||
        l.supplier.toLowerCase().includes(search.toLowerCase())
      )
    }
    if (statusFilter) {
      result = result.filter((l) => l.status === statusFilter)
    }
    if (zoneFilter !== 'ทุก Zone') {
      result = result.filter((l) => l.zone === zoneFilter)
    }
    if (startDate) {
      result = result.filter((l) => new Date(l.receivedAt) >= new Date(startDate))
    }
    if (endDate) {
      result = result.filter((l) => new Date(l.receivedAt) <= new Date(endDate))
    }

    setFiltered(result)
    setSelectedLot(null)
    setTimeline([])
  }, [search, statusFilter, zoneFilter, startDate, endDate, lots])

  const handleSelect = async (lot: Lot) => {
    setSelectedLot(lot)
    try {
      const data = await ledgerApi.getTimeline(lot.id)
      setTimeline(data.timeline)
    } catch {
      toast.error('โหลด timeline ไม่สำเร็จ')
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      await ledgerApi.exportCsv()
      toast.success('ดาวน์โหลด CSV สำเร็จ')
    } catch {
      toast.error('Export ไม่สำเร็จ')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">🔍 Traceability</h1>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {exporting ? 'กำลัง Export...' : '📥 Export CSV'}
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 ค้นหา Lot Number, Batch ID, Supplier..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">สถานะ</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Zone</label>
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            >
              {ZONE_OPTIONS.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">วันที่รับ (จาก)</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">วันที่รับ (ถึง)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>แสดง {filtered.length} / {lots.length} รายการ</span>
          {(search || statusFilter || zoneFilter !== 'ทุก Zone' || startDate || endDate) && (
            <button
              onClick={() => {
                setSearch('')
                setStatusFilter('')
                setZoneFilter('ทุก Zone')
                setStartDate('')
                setEndDate('')
              }}
              className="text-blue-500 hover:text-blue-700"
            >
              ล้าง filter
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Lot List */}
        <div className="md:col-span-2 space-y-2 max-h-[600px] overflow-y-auto">
          {loading ? (
            <p className="text-gray-400 text-sm text-center py-8">กำลังโหลด...</p>
          ) : filtered.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">ไม่พบข้อมูล</p>
          ) : filtered.map((lot) => (
            <button
              key={lot.id}
              onClick={() => handleSelect(lot)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedLot?.id === lot.id
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-sm text-gray-800">{lot.lotNumber}</p>
                  <p className="text-xs text-gray-400">{lot.batchId}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{lot.supplier}</p>
                </div>
                <LotStatusBadge status={lot.status} />
              </div>
              <div className="flex gap-3 mt-2 text-xs text-gray-400">
                <span>📦 {lot.weightKg.toLocaleString()} กก.</span>
                <span>🕒 {new Date(lot.receivedAt).toLocaleDateString('th-TH')}</span>
                {lot.zone && <span>📍 {lot.zone}</span>}
              </div>
              {lot.expiryDate && (
                <p className={`text-xs mt-1 font-medium ${
                  new Date(lot.expiryDate) < new Date()
                    ? 'text-red-500'
                    : new Date(lot.expiryDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                      ? 'text-yellow-500'
                      : 'text-gray-400'
                }`}>
                  หมดอายุ: {new Date(lot.expiryDate).toLocaleDateString('th-TH')}
                </p>
              )}
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div className="md:col-span-3">
          {selectedLot ? (
            <>
              <div className="bg-white rounded-lg border border-gray-200 p-4 mb-3">
                <h2 className="font-semibold text-gray-800 mb-1">{selectedLot.lotNumber}</h2>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                  <span>Batch: {selectedLot.batchId}</span>
                  <span>Supplier: {selectedLot.supplier}</span>
                  <span>น้ำหนัก: {selectedLot.weightKg.toLocaleString()} กก.</span>
                  <span>คงเหลือ: {selectedLot.remainingKg.toLocaleString()} กก.</span>
                  <span>Zone: {selectedLot.zone ?? '-'}</span>
                  <span>รับ: {new Date(selectedLot.receivedAt).toLocaleDateString('th-TH')}</span>
                  {selectedLot.expiryDate && (
                    <span className={
                      new Date(selectedLot.expiryDate) < new Date() ? 'text-red-500 font-medium' : ''
                    }>
                      หมดอายุ: {new Date(selectedLot.expiryDate).toLocaleDateString('th-TH')}
                    </span>
                  )}
                </div>
              </div>

              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />
                <div className="space-y-3">
                  {timeline.map((step, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-white border-2 border-blue-400 flex items-center justify-center text-lg z-10 shrink-0">
                        {STEP_ICONS[step.step] ?? '📌'}
                      </div>
                      <div className="bg-white rounded-lg border border-gray-200 p-3 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm text-gray-800">{step.label}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(step.date).toLocaleString('th-TH')}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{step.detail}</p>
                        <p className="text-xs text-blue-600 mt-0.5">
                          {step.weightKg?.toLocaleString()} กก.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm bg-white rounded-lg border border-gray-200">
              เลือก Lot จากรายการเพื่อดู Timeline
            </div>
          )}
        </div>
      </div>
    </div>
  )
}