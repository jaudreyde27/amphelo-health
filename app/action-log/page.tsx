'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2, Clock, AlertTriangle, Building2,
  History, ChevronDown, ChevronUp, RefreshCw, Zap,
} from 'lucide-react'
import Navigation from '@/components/Navigation'
import { getState } from '@/lib/storage'
import type { AppState, Workflow, WorkflowStatus } from '@/lib/types'

function displayStatus(w: Workflow): WorkflowStatus {
  if (w.status === 'in_progress' && !w.callId) return 'scheduled'
  return w.status
}

const STATUS_LABEL: Record<WorkflowStatus, string> = {
  needs_approval: 'Needs Approval',
  scheduled:      'Scheduled',
  in_progress:    'In Progress',
  completed:      'Completed',
  failed:         'Action Needed',
}

const STATUS_STYLE: Record<WorkflowStatus, { text: string; bg: string; border: string }> = {
  needs_approval: { text: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-200' },
  scheduled:      { text: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200' },
  in_progress:    { text: 'text-violet-700', bg: 'bg-violet-50',  border: 'border-violet-200' },
  completed:      { text: 'text-teal-700',   bg: 'bg-teal-50',    border: 'border-teal-200' },
  failed:         { text: 'text-red-700',    bg: 'bg-red-50',     border: 'border-red-200' },
}

function StatusIcon({ status }: { status: WorkflowStatus }) {
  if (status === 'completed') return <CheckCircle2 className="w-4 h-4 text-teal-500" />
  if (status === 'failed')    return <AlertTriangle className="w-4 h-4 text-red-500" />
  return <Clock className="w-4 h-4 text-blue-500" />
}

function ActionLogContent() {
  const router = useRouter()
  const [state, setStateLocal] = useState<AppState | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    const s = getState()
    if (!s.onboardingComplete) { router.replace('/onboarding'); return }
    setStateLocal(s)
  }, [router])

  if (!state) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
    </div>
  )

  const { profile, workflows } = state

  // Show all workflows, most recent first
  const sorted = [...workflows].sort((a, b) => {
    const aDate = a.completedAt ?? a.scheduledAt ?? a.createdAt ?? ''
    const bDate = b.completedAt ?? b.scheduledAt ?? b.createdAt ?? ''
    return new Date(bDate).getTime() - new Date(aDate).getTime()
  })

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navigation patientName={profile?.name} />
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-slate-100 px-8 py-7">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-slate-400" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Amphelo Action Log</h1>
              <p className="text-sm text-slate-400 mt-0.5">All workflow activity and call history</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-7 max-w-3xl">
          {sorted.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <History className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-500">No activity yet</p>
              <p className="text-xs text-slate-400 mt-1">Workflow actions will appear here.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {sorted.map(w => {
                const status = displayStatus(w)
                const s = STATUS_STYLE[status]
                const isExpanded = expanded === w.id
                const dateStr = w.completedAt
                  ? new Date(w.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : w.scheduledAt
                    ? new Date(w.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : null

                return (
                  <div key={w.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="p-4 flex items-start gap-3">
                      {/* Status icon */}
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${s.bg} ${s.border}`}>
                        <StatusIcon status={status} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-900 leading-snug">{w.title}</p>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${s.text} ${s.bg} ${s.border}`}>
                              {STATUS_LABEL[status]}
                            </span>
                            {w.isRecurring
                              ? <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full"><RefreshCw className="w-2.5 h-2.5" />Recurring</span>
                              : <span className="inline-flex items-center gap-1 text-xs text-violet-600 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full"><Zap className="w-2.5 h-2.5" />Ad Hoc</span>
                            }
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                          {w.pharmacyName && (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Building2 className="w-3 h-3" />{w.pharmacyName}
                            </span>
                          )}
                          {dateStr && (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Clock className="w-3 h-3" />{dateStr}
                            </span>
                          )}
                        </div>

                        {w.notes && (
                          <p className={`text-xs mt-2 rounded-lg px-3 py-1.5 ${
                            status === 'failed'    ? 'text-red-600 bg-red-50 border border-red-100' :
                            status === 'completed' ? 'text-teal-700 bg-teal-50 border border-teal-100' :
                            'text-slate-600 bg-slate-50 border border-slate-100'
                          }`}>{w.notes}</p>
                        )}

                        {w.callId && (
                          <button
                            onClick={() => setExpanded(isExpanded ? null : w.id)}
                            className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Call transcript {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-100 px-4 py-3 bg-slate-50">
                        <p className="text-xs text-slate-400 italic">
                          Transcript not yet available — it may still be processing. Call ID: {w.callId}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default function ActionLogPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      </div>
    }>
      <ActionLogContent />
    </Suspense>
  )
}
