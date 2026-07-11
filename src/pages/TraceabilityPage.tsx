import { useState } from 'react'
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

export default function TraceabilityPage() {
  const [query, setQuery] = useState('')
  const [lots, setLots] = useState<Lot[]>([])
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null)
  const [timeline, setTimeline] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setSearching(true)
    try {
      const all = await lotsApi.getAll()
      const filtered = all.filter(
        (l) => l.lotNumber.includes(query) || l.batchId.includes(query)
      )
      setLots(filtered)
      setSelectedLot(null)
      setTimeline([])
    } catch {
      toast.error('ค้นหาไม่สำเร็จ')
    } finally {
      setSearching(false)
    }
  }

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
    <div className="space-y-6">
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

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหาด้วย Lot Number หรือ Batch ID..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={searching}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {searching ? 'กำลังค้นหา...' : 'ค้นหา'}
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lot List */}
        {lots.length > 0 && (
          <div className="space-y-2">
            <h2 className="font-semibold text-gray-700 text-sm">ผลการค้นหา ({lots.length})</h2>
            {lots.map((lot) => (
              <button
                key={lot.id}
                onClick={() => handleSelect(lot)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedLot?.id === lot.id
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <p className="font-medium text-sm text-gray-800">{lot.lotNumber}</p>
                <p className="text-xs text-gray-500">{lot.batchId}</p>
                <div className="mt-1"><LotStatusBadge status={lot.status} /></div>
              </button>
            ))}
          </div>
        )}

        {/* Timeline */}
        {selectedLot && (
          <div className="md:col-span-2">
            <h2 className="font-semibold text-gray-700 mb-4">
              Timeline: {selectedLot.lotNumber}
            </h2>
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-4">
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
                      <p className="text-xs text-blue-600 mt-0.5">{step.weightKg?.toLocaleString()} กก.</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}