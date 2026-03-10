'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  CheckCircle2, Clock, AlertCircle, Loader2, Calendar,
  Pill, Building2, RefreshCw, Zap, ArrowRight, Phone,
  Cpu, User, Shield, HeartHandshake, Stethoscope, History, ChevronDown, ChevronUp, BellRing,
} from 'lucide-react'
import Navigation from '@/components/Navigation'
import { getState, updateWorkflow } from '@/lib/storage'
import { formatScheduledDate } from '@/lib/workflows'
import type { AppState, Workflow, WorkflowStatus } from '@/lib/types'

const STATUS: Record<WorkflowStatus, { label: string; dot: string; text: string; bg: string; border: string; icon: React.ElementType }> = {
  needs_approval: { label: 'Needs Approval',        dot: 'bg-amber-400',  text: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-200',  icon: AlertCircle },
  scheduled:      { label: 'Scheduled',              dot: 'bg-blue-400',   text: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200',   icon: Calendar },
  in_progress:    { label: 'In Progress',            dot: 'bg-violet-400', text: 'text-violet-700', bg: 'bg-violet-50',  border: 'border-violet-200', icon: Loader2 },
  completed:      { label: 'Completed',              dot: 'bg-teal-400',   text: 'text-teal-700',   bg: 'bg-teal-50',    border: 'border-teal-200',   icon: CheckCircle2 },
  failed:         { label: 'Action Needed',          dot: 'bg-red-400',    text: 'text-red-700',    bg: 'bg-red-50',     border: 'border-red-200',    icon: AlertCircle },
}

function Badge({ status }: { status: WorkflowStatus }) {
  const s = STATUS[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${s.text} ${s.bg} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${status === 'in_progress' ? 'animate-pulse' : ''}`} />
      {s.label}
    </span>
  )
}

// A workflow is only truly "in progress" if a call was actually placed (has a callId)
function displayStatus(w: Workflow): WorkflowStatus {
  if (w.status === 'in_progress' && !w.callId) return 'scheduled'
  return w.status
}

function WorkflowCard({ w, onApprove, onTrigger }: { w: Workflow; onApprove: (id: string) => void; onTrigger: (id: string) => void }) {
  const isDevice = w.title?.toLowerCase().startsWith('reorder')
  const isSpecialist = w.type === 'custom' && w.title?.toLowerCase().startsWith('check in')
  const status = displayStatus(w)
  return (
    <div className="group bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-slate-300 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSpecialist ? 'bg-violet-50' : isDevice ? 'bg-cyan-50' : 'bg-blue-50'}`}>
            {isSpecialist ? <Stethoscope className="w-5 h-5 text-violet-600" /> : isDevice ? <Cpu className="w-5 h-5 text-cyan-600" /> : <Pill className="w-5 h-5 text-blue-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-slate-900">{w.title}</p>
              {w.isRecurring ? (
                <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  <RefreshCw className="w-2.5 h-2.5" />Recurring
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-violet-600 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full">
                  <Zap className="w-2.5 h-2.5" />Ad Hoc
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 line-clamp-1">{w.description}</p>
            <div className="flex items-center gap-4 mt-2.5 flex-wrap">
              {w.pharmacyName && (
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Building2 className="w-3 h-3" />{w.pharmacyName}
                </span>
              )}
              {w.pharmacyPhone ? (
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Phone className="w-3 h-3" />{w.pharmacyPhone}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-amber-500 font-medium">
                  <Phone className="w-3 h-3" />No phone on file
                </span>
              )}
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="w-3 h-3" />{formatScheduledDate(w.scheduledAt)}
              </span>
            </div>
            {w.notes && (
              <p className="text-xs text-red-600 mt-2 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5">
                {w.notes}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2.5 shrink-0">
          <Badge status={status} />
          {status === 'needs_approval' && (
            <button onClick={() => onApprove(w.id)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
              Approve <ArrowRight className="w-3 h-3" />
            </button>
          )}
          {(status === 'scheduled' || status === 'failed') && (
            <button onClick={() => onTrigger(w.id)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-colors">
              <Zap className="w-3 h-3" />{status === 'failed' ? 'Retry' : 'Run now'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Care network card
function CareNode({
  icon: Icon, title, color, items,
}: {
  icon: React.ElementType; title: string; color: string; items: string[]
}) {
  if (items.length === 0) return null
  const colors: Record<string, { bg: string; icon: string; dot: string }> = {
    blue:   { bg: 'bg-blue-50 border-blue-100',     icon: 'bg-blue-100 text-blue-600',     dot: 'bg-blue-400' },
    indigo: { bg: 'bg-indigo-50 border-indigo-100', icon: 'bg-indigo-100 text-indigo-600', dot: 'bg-indigo-400' },
    cyan:   { bg: 'bg-cyan-50 border-cyan-100',     icon: 'bg-cyan-100 text-cyan-600',     dot: 'bg-cyan-400' },
    teal:   { bg: 'bg-teal-50 border-teal-100',     icon: 'bg-teal-100 text-teal-600',     dot: 'bg-teal-400' },
    green:  { bg: 'bg-green-50 border-green-100',   icon: 'bg-green-100 text-green-600',   dot: 'bg-green-400' },
    purple: { bg: 'bg-purple-50 border-purple-100', icon: 'bg-purple-100 text-purple-600', dot: 'bg-purple-400' },
  }
  const c = colors[color] ?? colors.blue
  return (
    <div className={`rounded-2xl border p-4 ${c.bg}`}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${c.icon}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{title}</span>
      </div>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${c.dot}`} />
            <span className="text-xs text-slate-700 leading-snug">{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DashboardContent() {
  const router = useRouter()
  const [state, setStateLocal] = useState<AppState | null>(null)
  const [triggering, setTriggering] = useState<string | null>(null)
  const [transcripts, setTranscripts] = useState<Record<string, { transcript: string | null; summary: string | null; endedAt: string | null; duration: number | null }>>({})
  const [expandedTranscript, setExpandedTranscript] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') ?? 'overview'

  useEffect(() => {
    const s = getState()
    if (!s.onboardingComplete) { router.replace('/onboarding'); return }
    setStateLocal(s)
  }, [router])

  const refresh = () => setStateLocal(getState())

  // Poll in-progress workflows that have a callId
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
            if (data.transcript || data.summary) {
              setTranscripts(prev => ({ ...prev, [w.id]: { transcript: data.transcript, summary: data.summary, endedAt: data.endedAt, duration: data.duration } }))
            }
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
          medicationName: med?.name ?? w.medicationName,
          medicationDosage: med?.dosage ?? '',
          prescriptionNumber: med?.prescriptionNumber ?? '',
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
  const extended = state as any

  const needs   = workflows.filter(w => w.status === 'needs_approval')
  const sched   = workflows.filter(w => w.status === 'scheduled' || (w.status === 'in_progress' && !w.callId))
  const active  = workflows.filter(w => w.status === 'in_progress' && w.callId)
  const done    = workflows.filter(w => w.status === 'completed')
  const failed  = workflows.filter(w => w.status === 'failed')

  const greeting = () => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  }

  // Stats: Needs Approval | Scheduled | Action Needed | Completed
  const STATS = [
    { label: 'Needs Approval', value: needs.length,  color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-100' },
    { label: 'Scheduled',      value: sched.length,  color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-100' },
    { label: 'Action Needed',  value: failed.length, color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-100' },
    { label: 'Completed',      value: done.length,   color: 'text-teal-600',   bg: 'bg-teal-50',   border: 'border-teal-100' },
  ]

  const normalizeSpecialtyDisplay = (s: string): string => {
    if (!s?.trim()) return s
    const map: [RegExp, string][] = [
      [/^endo(crin(olog(ist|y)?)?)?$/i, 'Endocrinology'],
      [/^pcp$|^primary[\s-]?care([\s-]?physician)?$/i, 'Primary Care'],
      [/^internal[\s-]?med(icine)?$/i, 'Internal Medicine'],
      [/^family[\s-]?(med(icine)?|practice|physician)?$/i, 'Family Medicine'],
      [/^cardio(log(ist|y))?$/i, 'Cardiology'],
      [/^nephro(log(ist|y))?$/i, 'Nephrology'],
      [/^ophthalm(olog(ist|y))?$/i, 'Ophthalmology'],
      [/^podiatr(ist|y)$/i, 'Podiatry'],
      [/^neuro(log(ist|y))?$/i, 'Neurology'],
      [/^derm(atolog(ist|y))?$/i, 'Dermatology'],
      [/^gastro(enterolog(ist|y))?$/i, 'Gastroenterology'],
      [/^rheum(atolog(ist|y))?$/i, 'Rheumatology'],
      [/^pulm(onolog(ist|y))?$/i, 'Pulmonology'],
      [/^ob[\s-]?gyn|obstet(rics)?|gynecolog(ist|y)$/i, 'OB/GYN'],
      [/^psych(iatr(ist|y))?$/i, 'Psychiatry'],
    ]
    const t = s.trim()
    for (const [re, full] of map) { if (re.test(t)) return full }
    if (t === t.toLowerCase()) return t.charAt(0).toUpperCase() + t.slice(1)
    return t
  }

  const prescriberItems: string[] = (extended.prescribers ?? [])
    .filter((p: any) => p.name?.trim())
    .map((p: any) => [p.name, p.specialty && `(${normalizeSpecialtyDisplay(p.specialty)})`].filter(Boolean).join(' '))

  const medicationItems: string[] = state.medications.map(m => [m.name, m.dosage].filter(Boolean).join(' '))

  const deviceItems: string[] = (extended.devices ?? [])
    .filter((d: any) => d.devType?.trim())
    .map((d: any) => [d.brand, d.devType, d.model].filter(Boolean).join(' '))

  const pharmacyItems: string[] = state.pharmacies.flatMap(p => {
    const lines = [p.name]
    if (p.address?.trim()) lines.push(p.address.trim())
    if (p.phone?.trim()) lines.push(p.phone.trim())
    return lines.length > 1 ? [lines.join(' · ')] : lines
  })

  const insuranceItems: string[] = (extended.insurancePlans ?? [])
    .filter((p: any) => p.planName?.trim())
    .map((p: any) => [p.planName, `(${p.planType})`, p.coverageType && `· ${p.coverageType}`].filter(Boolean).join(' '))

  const manufacturerItems: string[] = (extended.manufacturers ?? [])
    .filter((m: any) => m.name?.trim())
    .map((m: any) => [m.name, m.phone && `— ${m.phone}`].filter(Boolean).join(' '))

  const hasCareNetwork = prescriberItems.length > 0 || medicationItems.length > 0 || deviceItems.length > 0 || pharmacyItems.length > 0 || insuranceItems.length > 0

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

        <div className="px-8 py-7 space-y-7 max-w-5xl">

          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'overview' && <>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STATS.map(s => (
              <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-5 card-shadow`}>
                <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-xs font-medium text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Next Scheduled Call */}
          {(() => {
            const next = [...sched, ...needs]
              .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0]
            if (!next) return null
            const daysUntil = Math.ceil((new Date(next.scheduledAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            const urgency = daysUntil <= 1
            return (
              <div className={`flex items-center justify-between gap-4 rounded-2xl px-5 py-4 border ${urgency ? 'bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-200' : 'bg-gradient-to-r from-blue-50 to-sky-50 border-blue-200'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${urgency ? 'bg-violet-600' : 'bg-blue-600'}`}>
                    <BellRing className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${urgency ? 'text-violet-500' : 'text-blue-500'}`}>Next scheduled call</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{next.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <Building2 className="w-3 h-3" />{next.pharmacyName}
                      <span className="text-slate-300">·</span>
                      <Clock className="w-3 h-3" />{formatScheduledDate(next.scheduledAt)}
                    </p>
                  </div>
                </div>
                {next.status === 'scheduled' && (
                  <button onClick={() => handleTrigger(next.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-colors shrink-0 ${urgency ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm shadow-violet-200' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                    <Zap className="w-3 h-3" />Call now
                  </button>
                )}
                {next.status === 'needs_approval' && (
                  <button onClick={() => handleApprove(next.id)}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-amber-600 text-white hover:bg-amber-700 transition-colors shrink-0 shadow-sm shadow-amber-200">
                    Approve <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            )
          })()}

          {/* Care Network */}
          {hasCareNetwork && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <HeartHandshake className="w-4 h-4 text-slate-400" />
                <h2 className="text-base font-bold text-slate-900">Your Care Network</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <CareNode icon={User}      title="Prescribers"          color="blue"   items={prescriberItems} />
                <CareNode icon={Pill}      title="Medications"          color="indigo" items={medicationItems} />
                <CareNode icon={Cpu}       title="Devices"              color="cyan"   items={deviceItems} />
                <CareNode icon={Building2} title="Pharmacies"           color="teal"   items={pharmacyItems} />
                <CareNode icon={Shield}    title="Insurance"            color="green"  items={insuranceItems} />
                <CareNode icon={Phone}     title="Manufacturer Support" color="purple" items={manufacturerItems} />
              </div>
            </div>
          )}

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

          {/* In Progress (live calls only) */}
          {active.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
                <h2 className="text-base font-bold text-slate-900">In Progress</h2>
                <span className="text-xs text-slate-400 ml-auto">{active.length} active call{active.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-3">
                {active.map(w => <WorkflowCard key={w.id} w={w} onApprove={handleApprove} onTrigger={handleTrigger} />)}
              </div>
            </div>
          )}

          {/* Scheduled Workflows + Ad Hoc */}
          {[...needs, ...sched].length > 0 && (() => {
            const all = [...needs, ...sched]
            const recurring = all.filter(w => w.isRecurring)
            const adhoc = all.filter(w => !w.isRecurring)
            return (
              <div className="space-y-6">
                {recurring.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                      <h2 className="text-base font-bold text-slate-900">Scheduled Workflows</h2>
                      <span className="text-xs text-slate-400 ml-auto">{recurring.length} total</span>
                    </div>
                    <div className="space-y-3">
                      {recurring.map(w => <WorkflowCard key={w.id} w={w} onApprove={handleApprove} onTrigger={handleTrigger} />)}
                    </div>
                  </div>
                )}
                {adhoc.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-3.5 h-3.5 text-violet-400" />
                      <h2 className="text-base font-bold text-slate-900">Ad Hoc Requests</h2>
                      <span className="text-xs text-slate-400 ml-auto">{adhoc.length} total</span>
                    </div>
                    <div className="space-y-3">
                      {adhoc.map(w => <WorkflowCard key={w.id} w={w} onApprove={handleApprove} onTrigger={handleTrigger} />)}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

          {/* Action Needed (failed) */}
          {failed.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                <h2 className="text-base font-bold text-slate-900">Action Needed</h2>
                <span className="text-xs text-slate-400 ml-auto">{failed.length} total</span>
              </div>
              <div className="space-y-3">
                {failed.map(w => <WorkflowCard key={w.id} w={w} onApprove={handleApprove} onTrigger={handleTrigger} />)}
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

          </>}

          {/* ── COMPLETED TAB ── */}
          {activeTab === 'completed' && (
            done.length > 0 ? (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <h2 className="text-base font-bold text-slate-900">Completed Workflows</h2>
                  <span className="text-xs text-slate-400 ml-auto">{done.length} total</span>
                </div>
                <div className="space-y-3">
                  {done.map(w => <WorkflowCard key={w.id} w={w} onApprove={handleApprove} onTrigger={handleTrigger} />)}
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-500">No completed workflows yet</p>
                <p className="text-xs text-slate-400 mt-1">Workflows will appear here once calls are finished.</p>
              </div>
            )
          )}

          {/* ── CALL HISTORY TAB ── */}
          {activeTab === 'history' && (
            workflows.some(w => w.callId) ? (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-4 h-4 text-slate-400" />
                  <h2 className="text-base font-bold text-slate-900">Call History</h2>
                </div>
                <div className="space-y-3">
                  {workflows.filter(w => w.callId).map(w => {
                    const info = transcripts[w.id]
                    const isExpanded = expandedTranscript === w.id
                    return (
                      <div key={w.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                        <div className="flex items-start justify-between gap-4 p-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800">{w.title}</p>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              {w.pharmacyName && <span className="text-xs text-slate-400 flex items-center gap-1"><Building2 className="w-3 h-3" />{w.pharmacyName}</span>}
                              {w.completedAt && <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(w.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
                              {info?.duration && <span className="text-xs text-slate-400">{Math.round(info.duration)}s</span>}
                            </div>
                            {info?.summary && <p className="text-xs text-slate-500 mt-2 bg-slate-50 rounded-lg px-3 py-2">{info.summary}</p>}
                            {w.notes && !info?.summary && (
                              <p className={`text-xs mt-2 rounded-lg px-3 py-2 ${w.status === 'completed' ? 'text-teal-700 bg-teal-50 border border-teal-100' : 'text-red-600 bg-red-50 border border-red-100'}`}>
                                {w.notes}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge status={w.status} />
                            {(info?.transcript || w.callId) && (
                              <button onClick={() => setExpandedTranscript(isExpanded ? null : w.id)}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                                Transcript {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            )}
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="border-t border-slate-100 px-4 py-3 bg-slate-50">
                            {info?.transcript ? (
                              <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed max-h-64 overflow-y-auto">{info.transcript}</pre>
                            ) : (
                              <p className="text-xs text-slate-400 italic">Transcript not yet available — it may still be processing.</p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <History className="w-7 h-7 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-500">No call history yet</p>
                <p className="text-xs text-slate-400 mt-1">Calls will appear here once workflows have been triggered.</p>
              </div>
            )
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
