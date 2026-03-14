'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2, Clock, AlertTriangle, Loader2,
  Pill, Building2, Phone, Zap, ArrowRight,
  Calendar, RefreshCw,
} from 'lucide-react'
import Navigation from '@/components/Navigation'
import { getState, updateWorkflow } from '@/lib/storage'
import type { AppState, Workflow, WorkflowStatus } from '@/lib/types'

function displayStatus(w: Workflow): WorkflowStatus {
  if (w.status === 'in_progress' && !w.callId) return 'scheduled'
  return w.status
}

function StatusCircle({ status }: { status: WorkflowStatus }) {
  if (status === 'completed') return (
    <div className="w-9 h-9 rounded-full bg-teal-50 border-2 border-teal-200 flex items-center justify-center shrink-0">
      <CheckCircle2 className="w-4 h-4 text-teal-500" />
    </div>
  )
  if (status === 'failed') return (
    <div className="w-9 h-9 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center shrink-0">
      <AlertTriangle className="w-4 h-4 text-red-500" />
    </div>
  )
  // scheduled, in_progress, needs_approval
  return (
    <div className="w-9 h-9 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center shrink-0">
      <Clock className={`w-4 h-4 text-blue-500 ${status === 'in_progress' ? 'animate-pulse' : ''}`} />
    </div>
  )
}

function StatusItem({ w, onApprove, onTrigger }: {
  w: Workflow
  onApprove: (id: string) => void
  onTrigger: (id: string) => void
}) {
  const status = displayStatus(w)
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex gap-3 hover:shadow-sm hover:border-slate-300 transition-all">
      <StatusCircle status={status} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900 leading-snug">{w.title}</p>
          {w.isRecurring && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
              <RefreshCw className="w-2.5 h-2.5" />Recurring
            </span>
          )}
        </div>
        {w.description && (
          <p className="text-xs text-slate-500 mt-0.5 leading-snug">{w.description}</p>
        )}
        {(w.pharmacyName || w.pharmacyPhone) && (
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
            {w.pharmacyName && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Building2 className="w-3 h-3" />{w.pharmacyName}
              </span>
            )}
            {w.pharmacyPhone && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Phone className="w-3 h-3" />{w.pharmacyPhone}
              </span>
            )}
          </div>
        )}
        {w.notes && (
          <p className={`text-xs mt-2 rounded-lg px-3 py-1.5 leading-snug ${
            status === 'failed'    ? 'text-red-600 bg-red-50 border border-red-100' :
            status === 'completed' ? 'text-teal-700 bg-teal-50 border border-teal-100' :
            'text-slate-600 bg-slate-50 border border-slate-100'
          }`}>{w.notes}</p>
        )}
        {(status === 'needs_approval' || status === 'scheduled' || status === 'failed') && (
          <div className="mt-2.5 flex gap-2">
            {status === 'needs_approval' && (
              <button onClick={() => onApprove(w.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                Approve <ArrowRight className="w-3 h-3" />
              </button>
            )}
            {(status === 'scheduled' || status === 'failed') && (
              <button onClick={() => onTrigger(w.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-colors">
                <Zap className="w-3 h-3" />{status === 'failed' ? 'Retry' : 'Run now'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function SectionHeader({ icon: Icon, iconColor, title, count }: {
  icon: React.ElementType; iconColor: string; title: string; count: number
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className={`w-4 h-4 ${iconColor}`} />
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      <span className="text-xs text-slate-400 ml-auto">{count} item{count !== 1 ? 's' : ''}</span>
    </div>
  )
}

function DashboardContent() {
  const router = useRouter()
  const [state, setStateLocal] = useState<AppState | null>(null)

  useEffect(() => {
    const s = getState()
    if (!s.onboardingComplete) { router.replace('/onboarding'); return }
    setStateLocal(s)
  }, [router])

  const refresh = () => setStateLocal(getState())

  // Poll in-progress workflows
  useEffect(() => {
    const interval = setInterval(async () => {
      const s = getState()
      const inProgress = s.workflows.filter(w => w.status === 'in_progress' && w.callId)
      if (inProgress.length === 0) return
      await Promise.all(inProgress.map(async (w) => {
        try {
          const res = await fetch(`/api/call-status?id=${w.callId}`)
          const data = await res.json()
          if (data.status && data.status !== 'in_progress') {
            updateWorkflow(w.id, {
              status: data.status,
              notes: data.endedReason ?? data.summary ?? undefined,
              completedAt: data.endedAt ?? undefined,
            })
          }
        } catch { /* silently skip */ }
      }))
      setStateLocal(getState())
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleApprove = (id: string) => {
    updateWorkflow(id, { status: 'scheduled' })
    refresh()
  }

  const handleTrigger = async (id: string) => {
    if (!state) return
    const w = state.workflows.find(x => x.id === id)
    if (!w) return
    if (!w.pharmacyPhone) {
      updateWorkflow(id, { status: 'failed', notes: 'No pharmacy phone number on file. Add one in Settings → Pharmacies.' })
      refresh()
      return
    }
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
          medicationName: med?.name ?? w.medicationName,
          medicationDosage: med?.dosage ?? '',
          prescriptionNumber: med?.prescriptionNumber ?? '',
          workflowType: w.type,
        }),
      })
      const data = await res.json()
      updateWorkflow(id, data.id
        ? { status: 'in_progress', callId: data.id }
        : { status: 'failed', notes: data.error })
    } catch {
      updateWorkflow(id, { status: 'failed', notes: 'Network error' })
    } finally {
      refresh()
    }
  }

  if (!state) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
    </div>
  )

  const { profile, workflows } = state

  // Categorize by content type
  const prescriptions = workflows.filter(w => w.isRecurring && w.type !== 'custom')
  const appointments  = workflows.filter(w => w.type === 'custom' && w.isRecurring)
  const adHoc         = workflows.filter(w => !w.isRecurring)

  const greeting = () => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navigation patientName={profile?.name} />
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-slate-100 px-8 py-7">
          <h1 className="text-2xl font-bold text-slate-900">{greeting()}, {profile?.name?.split(' ')[0]} 👋</h1>
          <p className="text-sm text-slate-400 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="px-8 py-7 space-y-8 max-w-3xl">

          {/* Section 1: Prescriptions & Device Pickups */}
          {prescriptions.length > 0 && (
            <section>
              <SectionHeader icon={Pill} iconColor="text-blue-500" title="Prescriptions & Device Pickups" count={prescriptions.length} />
              <div className="space-y-2.5">
                {prescriptions.map(w => (
                  <StatusItem key={w.id} w={w} onApprove={handleApprove} onTrigger={handleTrigger} />
                ))}
              </div>
            </section>
          )}

          {/* Section 2: Appointments */}
          {appointments.length > 0 && (
            <section>
              <SectionHeader icon={Calendar} iconColor="text-violet-500" title="Appointments" count={appointments.length} />
              <div className="space-y-2.5">
                {appointments.map(w => (
                  <StatusItem key={w.id} w={w} onApprove={handleApprove} onTrigger={handleTrigger} />
                ))}
              </div>
            </section>
          )}

          {/* Section 3: Current Ad Hoc Requests */}
          {adHoc.length > 0 && (
            <section>
              <SectionHeader icon={Zap} iconColor="text-violet-400" title="Current Ad Hoc Requests" count={adHoc.length} />
              <div className="space-y-2.5">
                {adHoc.map(w => (
                  <StatusItem key={w.id} w={w} onApprove={handleApprove} onTrigger={handleTrigger} />
                ))}
              </div>
            </section>
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

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
