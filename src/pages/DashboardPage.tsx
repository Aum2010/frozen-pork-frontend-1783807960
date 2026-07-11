import { useEffect, useState } from 'react'
import { advisoryApi } from '../api/advisory'
import { tanksApi } from '../api/tanks'
import type { AdvisoryStatus, Tank } from '../types'
import { TankStatusBadge } from '../components/StatusBadge'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const [advisory, setAdvisory] = useState<AdvisoryStatus | null>(null)
  const [tanks, setTanks] = useState<Tank[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('advisory:', advisory)
    const load = async () => {
      try {
        const [adv, tkns] = await Promise.all([
          advisoryApi.getStatus(),
          tanksApi.getAll(),
        ])
        setAdvisory(adv)
        setTanks(tkns)
      } catch (e){
        console.error('load error:', e)
        toast.error('โหลดข้อมูลไม่สำเร็จ')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className="text-center py-12 text-gray-500">กำลังโหลด...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800">📊 Dashboard</h1>

      {/* Alert Banner */}
      {advisory?.hasAlert && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="font-medium text-red-800 mb-2">⚠️ มีการแจ้งเตือน</p>
          <div className="space-y-1 text-sm text-red-700">
            {advisory.reorder.shouldReorder && <p>🛒 {advisory.reorder.message}</p>}
            {advisory.thaw.shouldThaw && <p>🌡️ {advisory.thaw.message}</p>}
            {advisory.tankReady.readyCount > 0 && <p>🪣 {advisory.tankReady.message}</p>}
          </div>
        </div>
      )}

      {/* Stats */}
      {advisory && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="สต็อกคงเหลือ" value={`${advisory.reorder.totalStockKg} กก.`} sub={`${advisory.reorder.daysLeft} วัน`} />
          <StatCard label="กำลังละลาย" value={`${advisory.thaw.thawingKg} กก.`} sub={advisory.thaw.shouldThaw ? '⚠️ ไม่พอ' : '✅ พอ'} />
          <StatCard label="รอเข้าถัง" value={`${advisory.tankReady.readyCount} รายการ`} />
          <StatCard
            label="ถังที่ใช้งาน"
            value={`${tanks.filter((t) => t.status !== 'EMPTY').length}/${tanks.length}`}
            sub="ใบ"
          />
        </div>
      )}

      {/* Tank Grid */}
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3">🪣 สถานะถังน้ำแข็ง</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {tanks.map((tank) => (
            <TankCard key={tank.id} tank={tank} />
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function TankCard({ tank }: { tank: Tank }) {
  const pct = tank.capacityKg > 0 ? (tank.currentWeightKg / tank.capacityKg) * 100 : 0
  const borderColor = tank.isFifoNext ? 'border-orange-400' : 'border-gray-200'

  return (
    <div className={`bg-white rounded-lg border-2 ${borderColor} p-3`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm text-gray-700">ถัง {tank.tankNumber}</span>
        {tank.isFifoNext && <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">FIFO</span>}
      </div>
      <TankStatusBadge status={tank.status} />
      <div className="mt-2">
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">{tank.currentWeightKg}/{tank.capacityKg} กก.</p>
      </div>
    </div>
  )
}