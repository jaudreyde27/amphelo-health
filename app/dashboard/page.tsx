'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2, Clock, AlertTriangle, AlertCircle, Loader2,
  Zap, Calendar, Pill,
} from 'lucide-react'
import Navigation from '@/components/Navigation'
import { getState, updateWorkflow } from '@/lib/storage'
import type { AppState, Medication, Pharmacy, Workflow, WorkflowStatus } from '@/lib/types'

type MedStatus = 'ready_for_pickup' | 'refill_in_progress' | 'upcoming' | 'no_refills_pharmacy' | 'no_refills_user' | 'none'

// needs_approval → treat as scheduled for generic card use
function displayStatus(w: Workflow): WorkflowStatus {
  if (w.status === 'needs_approval') return 'scheduled'
  if (w.status === 'in_progress' && !w.callId) return 'scheduled'
  return w.status
}

// For each medication, pick the most relevant current recurring workflow
function getMostRelevantWorkflow(workflows: Workflow[], medicationId: string): Workflow | null {
  const candidates = workflows.filter(w => w.medicationId === medicationId && w.isRecurring)
  if (candidates.length === 0) return null
  const priority: Record<WorkflowStatus, number> = {
    in_progress: 5, failed: 4, needs_approval: 3, scheduled: 2, completed: 1,
  }
  return candidates.sort((a, b) => {
    const diff = (priority[b.status] ?? 0) - (priority[a.status] ?? 0)
    if (diff !== 0) return diff
    return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
  })[0]
}

function getMedStatus(workflow: Workflow | null): MedStatus {
  if (!workflow) return 'none'
  const notes = (workflow.notes ?? '').toLowerCase()
  const { status, callId } = workflow
  if (status === 'in_progress' && callId) return 'refill_in_progress'
  if (status === 'completed') {
    if (notes.includes('ready for pickup')) return 'ready_for_pickup'
    if (notes.includes('reauthorization') || notes.includes('prescriber') || notes.includes('on hold'))
      return 'no_refills_pharmacy'
    return 'upcoming'
  }
  if (status === 'failed') {
    if (notes.includes('reauthorization') || notes.includes('prescriber') || notes.includes('on hold'))
      return 'no_refills_pharmacy'
    return 'no_refills_user'
  }
  return 'upcoming'
}

function MedStatusCircle({ medStatus }: { medStatus: MedStatus }) {
  if (medStatus === 'ready_for_pickup') return (
    <div className="w-9 h-9 rounded-full bg-teal-50 border-2 border-teal-200 flex items-center justify-center shrink-0">
      <CheckCircle2 className="w-4 h-4 text-teal-500" />
    </div>
  )
  if (medStatus === 'refill_in_progress') return (
    <div className="w-9 h-9 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center shrink-0">
      <Loader2 className="w-4 h-4 text-green-500 animate-spin" />
    </div>
  )
  if (medStatus === 'upcoming') return (
    <div className="w-9 h-9 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center shrink-0">
      <Clock className="w-4 h-4 text-blue-500" />
    </div>
  )
  if (medStatus === 'no_refills_pharmacy') return (
    <div className="w-9 h-9 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center shrink-0">
      <AlertCircle className="w-4 h-4 text-amber-500" />
    </div>
  )
  if (medStatus === 'no_refills_user') return (
    <div className="w-9 h-9 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center shrink-0">
      <AlertTriangle className="w-4 h-4 text-red-500" />
    </div>
  )
  return (
    <div className="w-9 h-9 rounded-full bg-slate-50 border-2 border-slate-100 flex items-center justify-center shrink-0">
      <Clock className="w-4 h-4 text-slate-300" />
    </div>
  )
}

// StatusCircle kept for generic workflow cards (appointments, ad hoc)
function StatusCircle({ status }: { status: WorkflowStatus | 'none' }) {
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
  if (status === 'none') return (
    <div className="w-9 h-9 rounded-full bg-slate-50 border-2 border-slate-100 flex items-center justify-center shrink-0">
      <Clock className="w-4 h-4 text-slate-300" />
    </div>
  )
  return (
    <div className="w-9 h-9 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center shrink-0">
      <Clock className="w-4 h-4 text-blue-500" />
    </div>
  )
}

function RunNowButton({ workflowId, isFailed, onTrigger }: {
  workflowId: string; isFailed: boolean; onTrigger: (id: string) => void
}) {
  return (
    <button onClick={() => onTrigger(workflowId)}
      className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-colors">
      <Zap className="w-3 h-3" />{isFailed ? 'Retry' : 'Run now'}
    </button>
  )
}

function getMedHeadline(medStatus: MedStatus, medication: Medication): { text: string; color: string } {
  if (medStatus === 'ready_for_pickup')    return { text: 'Refill Ready for Pickup',                      color: 'text-teal-700' }
  if (medStatus === 'refill_in_progress') return { text: 'Refill in Progress',                             color: 'text-green-700' }
  if (medStatus === 'no_refills_pharmacy')return { text: 'No more refills — pharmacy contacted prescriber', color: 'text-amber-700' }
  if (medStatus === 'no_refills_user')    return { text: 'No more refills — user action needed',            color: 'text-red-600' }
  if (medStatus === 'none')               return { text: 'No Refill Scheduled',                             color: 'text-slate-400' }
  // upcoming
  const refill = nextRefillDate(medication)
  if (refill) {
    const days = Math.ceil((refill.getTime() - Date.now()) / 86400000)
    if (days <= 0) return { text: 'Refill to be confirmed', color: 'text-blue-700' }
    const dueStr = days === 1 ? 'tomorrow' : `in ${days} days`
    return { text: `Refill to be confirmed · Due ${dueStr}`, color: 'text-blue-700' }
  }
  return { text: 'Refill to be confirmed', color: 'text-blue-700' }
}

function nextRefillDate(medication: Medication): Date | null {
  if (!medication.lastFilled || !medication.daysSupply) return null
  const d = new Date(medication.lastFilled)
  d.setDate(d.getDate() + medication.daysSupply)
  return d
}

const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

// Section 1: one card per medication
function MedicationCard({ medication, workflow, pharmacy, onTrigger }: {
  medication: Medication
  workflow: Workflow | null
  pharmacy: Pharmacy | null
  onTrigger: (id: string) => void
}) {
  const medStatus = getMedStatus(workflow)
  const { text: headline, color: headlineColor } = getMedHeadline(medStatus, medication)
  const refillDate = nextRefillDate(medication)
  const wfStatus = workflow ? displayStatus(workflow) : 'none'

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex gap-3 hover:shadow-sm hover:border-slate-300 transition-all">
      <MedStatusCircle medStatus={medStatus} />
      <div className="flex-1 min-w-0">

        {/* Line 1: medication name (bold) + dosage (light grey) */}
        <p className="text-sm font-bold text-slate-900 leading-tight">
          {medication.name}
          <span className="font-normal text-slate-400 ml-1.5">{medication.dosage}</span>
        </p>

        {/* Line 2: 5-state status headline */}
        <p className={`text-sm font-bold mt-1 leading-tight ${headlineColor}`}>{headline}</p>

        {/* Date details */}
        <div className="mt-2 space-y-0.5">
          {refillDate && medStatus === 'upcoming' && (
            <p className="text-xs text-slate-500">
              <span className="font-medium">Next Refill:</span> {fmtDate(refillDate)}
            </p>
          )}
          {workflow && wfStatus === 'scheduled' && workflow.scheduledAt && (
            <p className="text-xs text-slate-500">
              <span className="font-medium">Amphelo to confirm with pharmacy:</span> {fmtDate(workflow.scheduledAt)}
            </p>
          )}
          {workflow?.completedAt && (
            <p className="text-xs text-slate-500">
              <span className="font-medium">Last action:</span> {fmtDate(workflow.completedAt)}
            </p>
          )}
        </div>

        {/* Refills remaining */}
        {medication.refillsRemaining !== undefined && (
          <p className={`text-[11px] mt-1.5 ${medication.refillsRemaining <= 1 ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
            {medication.refillsRemaining} refill{medication.refillsRemaining !== 1 ? 's' : ''} remaining
          </p>
        )}

        {/* Pharmacy — compact, small */}
        {pharmacy && (
          <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
            {[pharmacy.name, pharmacy.address, pharmacy.phone].filter(Boolean).join(' · ')}
          </p>
        )}

        {/* Notes */}
        {workflow?.notes && (
          <p className={`text-xs mt-2 rounded-lg px-3 py-1.5 leading-snug ${
            medStatus === 'no_refills_user'     ? 'text-red-600 bg-red-50 border border-red-100' :
            medStatus === 'no_refills_pharmacy' ? 'text-amber-700 bg-amber-50 border border-amber-100' :
            medStatus === 'ready_for_pickup'    ? 'text-teal-700 bg-teal-50 border border-teal-100' :
            'text-slate-600 bg-slate-50 border border-slate-100'
          }`}>{workflow.notes}</p>
        )}

        {workflow && (wfStatus === 'scheduled' || wfStatus === 'failed') && (
          <RunNowButton workflowId={workflow.id} isFailed={wfStatus === 'failed'} onTrigger={onTrigger} />
        )}
      </div>
    </div>
  )
}

// Section 2 + 3: generic status card for appointments and ad hoc
function StatusCard({ w, onTrigger }: { w: Workflow; onTrigger: (id: string) => void }) {
  const status = displayStatus(w)
  const actionDate = w.completedAt ?? w.scheduledAt
  const actionLabel = w.completedAt ? 'Last action' : 'Scheduled'

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex gap-3 hover:shadow-sm hover:border-slate-300 transition-all">
      <StatusCircle status={status} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900 leading-snug">{w.title}</p>
        {w.description && (
          <p className="text-xs text-slate-500 mt-0.5 leading-snug">{w.description}</p>
        )}

        {actionDate && (
          <p className="text-xs text-slate-400 mt-1.5">
            {actionLabel}: {new Date(actionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        )}

        {w.notes && (
          <p className={`text-xs mt-2 rounded-lg px-3 py-1.5 leading-snug ${
            status === 'failed'    ? 'text-red-600 bg-red-50 border border-red-100' :
            status === 'completed' ? 'text-teal-700 bg-teal-50 border border-teal-100' :
            'text-slate-600 bg-slate-50 border border-slate-100'
          }`}>{w.notes}</p>
        )}

        {(status === 'scheduled' || status === 'failed') && (
          <RunNowButton workflowId={w.id} isFailed={status === 'failed'} onTrigger={onTrigger} />
        )}
      </div>
    </div>
  )
}

function SectionHeader({ icon: Icon, iconColor, title, count }: {
  icon: React.ElementType; iconColor: string; title: string; count?: number
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className={`w-4 h-4 ${iconColor}`} />
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      {count !== undefined && (
        <span className="text-xs text-slate-400 ml-auto">{count} item{count !== 1 ? 's' : ''}</span>
      )}
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

  const { profile, workflows, medications, pharmacies } = state
  const appointments = workflows.filter(w => w.type === 'custom' && w.isRecurring)
  const adHoc        = workflows.filter(w => !w.isRecurring)

  const greeting = () => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navigation patientName={profile?.name} />
      <main className="flex-1 overflow-auto">
        <div className="bg-white border-b border-slate-100 px-8 py-7">
          <h1 className="text-2xl font-bold text-slate-900">{greeting()}, {profile?.name?.split(' ')[0]} 👋</h1>
          <p className="text-sm text-slate-400 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="px-8 py-7 space-y-8 max-w-3xl">

          {/* Section 1: one card per medication/device */}
          {medications.length > 0 && (
            <section>
              <SectionHeader icon={Pill} iconColor="text-blue-500" title="Prescriptions & Device Pickups" count={medications.length} />
              <div className="space-y-2.5">
                {medications.map(med => {
                  const workflow = getMostRelevantWorkflow(workflows, med.id)
                  const pharmacy = pharmacies.find(p => p.id === (workflow?.pharmacyId ?? med.pharmacyId)) ?? null
                  return (
                    <MedicationCard
                      key={med.id}
                      medication={med}
                      workflow={workflow}
                      pharmacy={pharmacy}
                      onTrigger={handleTrigger}
                    />
                  )
                })}
              </div>
            </section>
          )}

          {/* Section 2: Appointments — always visible */}
          <section>
            <SectionHeader icon={Calendar} iconColor="text-violet-500" title="Appointments" count={appointments.length} />
            {appointments.length > 0 ? (
              <div className="space-y-2.5">
                {appointments.map(w => <StatusCard key={w.id} w={w} onTrigger={handleTrigger} />)}
              </div>
            ) : (
              <div className="bg-white border border-dashed border-slate-200 rounded-xl px-4 py-5 text-center">
                <p className="text-xs text-slate-400">No upcoming appointments.</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Use <span className="font-medium text-slate-600">Ad Hoc Requests</span> to schedule one.
                </p>
              </div>
            )}
          </section>

          {/* Section 3: Ad Hoc Requests */}
          {adHoc.length > 0 && (
            <section>
              <SectionHeader icon={Zap} iconColor="text-violet-400" title="Current Ad Hoc Requests" count={adHoc.length} />
              <div className="space-y-2.5">
                {adHoc.map(w => <StatusCard key={w.id} w={w} onTrigger={handleTrigger} />)}
              </div>
            </section>
          )}

          {medications.length === 0 && appointments.length === 0 && adHoc.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Pill className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-500">No data yet</p>
              <p className="text-xs text-slate-400 mt-1">Complete onboarding to get started.</p>
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
