import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const NAV_ITEMS = [
  { to: '/', label: '📊 Dashboard', roles: ['WAREHOUSE', 'PRODUCTION', 'MANAGER', 'ADMIN'] },
  { to: '/receive', label: '🚛 รับสินค้า', roles: ['WAREHOUSE', 'MANAGER', 'ADMIN'] },
  { to: '/thaw', label: '🌡️ ละลาย', roles: ['WAREHOUSE', 'MANAGER', 'ADMIN'] },
  { to: '/tanks', label: '🪣 ถังน้ำแข็ง', roles: ['WAREHOUSE', 'PRODUCTION', 'MANAGER', 'ADMIN'] },
  { to: '/withdraw', label: '🏭 เบิกผลิต', roles: ['PRODUCTION', 'MANAGER', 'ADMIN'] },
  { to: '/traceability', label: '🔍 Traceability', roles: ['MANAGER', 'ADMIN'] },
]

export default function Navbar() {
  const { user, logout, isRole } = useAuth()
  const location = useLocation()

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-1">
          <span className="font-bold text-gray-800 mr-4">🐷 FrozenPork</span>
          {NAV_ITEMS.filter((n) => isRole(...n.roles)).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                location.pathname === item.to
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{user?.name} ({user?.role})</span>
          <button
            onClick={logout}
            className="text-sm text-red-500 hover:text-red-700"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
    </nav>
  )
}