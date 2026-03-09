'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, MessageSquare, Heart, LogOut, ChevronRight, Settings } from 'lucide-react'
import { clearState } from '@/lib/storage'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Workflows & status' },
  { href: '/chat', label: 'Ad Hoc Requests', icon: MessageSquare, desc: 'On-demand calls' },
  { href: '/settings', label: 'Settings', icon: Settings, desc: 'Update your profile' },
]

export default function Navigation({ patientName }: { patientName?: string }) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <aside className="w-60 bg-white border-r border-slate-100 flex flex-col h-screen sticky top-0 shrink-0">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm shadow-blue-200">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-900 block leading-tight">Amphelo</span>
            <span className="text-xs text-slate-400 leading-tight">Health</span>
          </div>
        </div>
      </div>

      {/* Patient chip */}
      {patientName && (
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white">
                {patientName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">{patientName}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <p className="text-xs text-slate-400">Active</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Navigation</p>
        {NAV.map(({ href, label, icon: Icon, desc }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-xl transition-all
                ${active
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 shrink-0" />
                <div>
                  <p className="text-xs font-semibold leading-tight">{label}</p>
                  <p className={`text-xs leading-tight mt-0.5 ${active ? 'text-blue-200' : 'text-slate-400'}`}>{desc}</p>
                </div>
              </div>
              <ChevronRight className={`w-3 h-3 shrink-0 transition-opacity ${active ? 'opacity-70' : 'opacity-0 group-hover:opacity-30'}`} />
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-3 border-t border-slate-100">
        <button
          onClick={() => { clearState(); router.push('/') }}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out / Reset
        </button>
      </div>
    </aside>
  )
}
