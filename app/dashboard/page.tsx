'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2, Clock, AlertCircle, Loader2, Calendar,
  Pill, Building2, RefreshCw, Zap, ArrowRight, Phone
} from 'lucide-react'
import Navigation from '@/components/Navigation'
import { getState, updateWorkflow } from '@/lib/storage'
import { formatScheduledDate } from '@/lib/workflows'
import type { AppState, Workflow, WorkflowStatus } from '@/lib/types'

const STATUS: Record<WorkflowStatus, { label: string; dot: string; text: string; bg: string; border: string; icon: React.ElementType }> = {
  needs_approval: { label: 'Needs Approval', dot: 'bg-amber-400',  text: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-200',  icon: AlertCircle },
  scheduled:      { label: 'Scheduled',      dot: 'bg-blue-400',   text: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200',   icon: Calendar },
  in_progress:    { label: 'In Progress',    dot: 'bg-violet-400', text: 'text-violet-700', bg: 'bg-violet-50',  border: 'border-violet-200', icon: Loader2 },
  completed:      { label: 'Completed',      dot: 'bg-teal-400',   text: 'text-teal-700',   bg: 'bg-teal-50',    border: 'border-teal-200',   icon: CheckCircle2 },
  failed:         { label: 'Failed',         dot: 'bg-red-400',    text: 'text-red-700',    bg: 'bg-red-50',     border: 'border-red-200',    icon: AlertCircle },
}

function Badge({ status }: { status: WorkflowStatus }) {
  const s = STATUS[status]
  const Icon = s.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${s.text} ${s.bg} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${status === 'in_progress' ? 'animate-pulse' : ''}`} />
      {s.label}
    </span>
  )
}

function WorkflowCard({ w, onApprove, onTrigger }: {
  w: Workflow
  onApprove: (id: string) => void
  onTrigger: (id: string) => void
}) {
  return (
    <div className="group bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-slate-300 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
            <Pill className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-slate-900">{w.title}</p>
              {w.isRecurring && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  <RefreshCw className="w-2.5 h-2.5" />Monthly
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 line-clamp-1">{w.description}</p>
            <div className="flex items-center gap-4 mt-2.5">
              {w.pharmacyName && (
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Building2 className="w-3 h-3" />{w.pharmacyName}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="w-3 h-3" />{formatScheduledDate(w.scheduledAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2.5 shrink-0">
          <Badge status={w.status} />
          {w.status === 'needs_approval' && (
            <button onClick={() => onApprove(w.id)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
              Approve
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
          {w.status === 'scheduled' && (
            <button onClick={() => onTrigger(w.id)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-colors">
              <Zap className="w-3 h-3" />Run now
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [state, setStateLocal] = useState<AppState | null>(null)
  const [triggering, setTriggering] = useState<string | null>(null)

  useEffect(() => {
    const s = getState()
    if (!s.onboardingComplete) { router.replace('/onboarding'); return }
    setStateLocal(s)
  }, [router])

  const refresh = () => setStateLocal(getState())

  const handleApprove = (id: string) => {
    updateWorkflow(id, { status: 'scheduled' })
    refresh()
  }

  const handleTrigger = async (id: string) => {
    if (!state) return
    const w = state.workflows.find(x => x.id === id)
    if (!w || !w.pharmacyPhone) return
    setTriggering(id)
    updateWorkflow(id, { status: 'in_progress' })
    refresh()
    try {
      const med = state.medications.find(m => m.id === w.medicationId)
      const res = await fetch('/api/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pharmacyPhone: w.pharmacyPhone,
          patientName: state.profile?.name,
          patientDOB: state.profile?.dateOfBirth,
          patientPhone: state.profile?.phone,
          medicationName: med?.name,
          medicationDosage: med?.dosage,
          prescriptionNumber: med?.prescriptionNumber,
          workflowType: w.type,
        }),
      })
      const data = await res.json()
      updateWorkflow(id, data.id ? { status: 'in_progress', callId: data.id } : { status: 'failed', notes: data.error })
    } catch {
      updateWorkflow(id, { status: 'failed', notes: 'Network error' })
    } finally {
      setTriggering(null)
      refresh()
    }
  }

  if (!state) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
    </div>
  )

  const { profile, workflows } = state
  const needs   = workflows.filter(w => w.status === 'needs_approval')
  const sched   = workflows.filter(w => w.status === 'scheduled')
  const active  = workflows.filter(w => w.status === 'in_progress')
  const done    = workflows.filter(w => w.status === 'completed')
  const failed  = workflows.filter(w => w.status === 'failed')

  const greeting = () => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  }

  const STATS = [
    { label: 'Needs Approval', value: needs.length,  color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-100' },
    { label: 'Scheduled',      value: sched.length,  color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-100' },
    { label: 'In Progress',    value: active.length, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
    { label: 'Completed',      value: done.length,   color: 'text-teal-600',   bg: 'bg-teal-50',   border: 'border-teal-100' },
  ]

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navigation patientName={profile?.name} />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-slate-100 px-8 py-7">
          <h1 className="text-2xl font-bold text-slate-900">
            {greeting()}, {profile?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="px-8 py-7 space-y-7 max-w-5xl">

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STATS.map(s => (
              <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-5 card-shadow`}>
                <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-xs font-medium text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Approval banner */}
          {needs.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-900">
                    {needs.length} workflow{needs.length !== 1 ? 's' : ''} waiting for approval
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">No calls will be made until you approve.</p>
                </div>
              </div>
              <button onClick={() => needs.forEach(w => handleApprove(w.id))}
                className="px-5 py-2.5 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition-colors shrink-0 shadow-sm shadow-amber-200">
                Approve All
              </button>
            </div>
          )}

          {/* Active workflows */}
          {[...active, ...needs, ...sched].length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900">Active Workflows</h2>
                <span className="text-xs text-slate-400">{[...active, ...needs, ...sched].length} total</span>
              </div>
              <div className="space-y-3">
                {[...active, ...needs, ...sched].map(w => (
                  <WorkflowCard key={w.id} w={w} onApprove={handleApprove} onTrigger={handleTrigger} />
                ))}
              </div>
            </div>
          )}

          {/* Failed */}
          {failed.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-4">Failed</h2>
              <div className="space-y-3">
                {failed.map(w => (
                  <WorkflowCard key={w.id} w={w} onApprove={handleApprove} onTrigger={handleTrigger} />
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {done.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-4">Completed</h2>
              <div className="space-y-3">
                {done.map(w => (
                  <WorkflowCard key={w.id} w={w} onApprove={handleApprove} onTrigger={handleTrigger} />
                ))}
              </div>
            </div>
          )}

          {workflows.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Pill className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-500">No workflows yet</p>
              <p className="text-xs text-slate-400 mt-1">Complete onboarding to generate your first workflows.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
