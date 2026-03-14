'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Share2, User, Pill, Cpu, Building2, Shield, Phone } from 'lucide-react'
import Navigation from '@/components/Navigation'
import { getState } from '@/lib/storage'
import type { AppState } from '@/lib/types'

function CareCard({
  icon: Icon, title, color, items,
}: {
  icon: React.ElementType; title: string; color: string; items: { primary: string; secondary?: string; tertiary?: string }[]
}) {
  if (items.length === 0) return null

  const colors: Record<string, { bg: string; border: string; iconBg: string; iconText: string; dot: string }> = {
    blue:   { bg: 'bg-blue-50',   border: 'border-blue-100',   iconBg: 'bg-blue-100',   iconText: 'text-blue-600',   dot: 'bg-blue-400' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-100', iconBg: 'bg-indigo-100', iconText: 'text-indigo-600', dot: 'bg-indigo-400' },
    cyan:   { bg: 'bg-cyan-50',   border: 'border-cyan-100',   iconBg: 'bg-cyan-100',   iconText: 'text-cyan-600',   dot: 'bg-cyan-400' },
    teal:   { bg: 'bg-teal-50',   border: 'border-teal-100',   iconBg: 'bg-teal-100',   iconText: 'text-teal-600',   dot: 'bg-teal-400' },
    green:  { bg: 'bg-green-50',  border: 'border-green-100',  iconBg: 'bg-green-100',  iconText: 'text-green-600',  dot: 'bg-green-400' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-100', iconBg: 'bg-purple-100', iconText: 'text-purple-600', dot: 'bg-purple-400' },
  }
  const c = colors[color] ?? colors.blue

  return (
    <div className={`rounded-2xl border p-5 ${c.bg} ${c.border}`}>
      <div className="flex items-center gap-2.5 mb-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.iconBg}`}>
          <Icon className={`w-4 h-4 ${c.iconText}`} />
        </div>
        <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</span>
        <span className="ml-auto text-xs text-slate-400">{items.length}</span>
      </div>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${c.dot}`} />
            <div>
              <p className="text-sm font-medium text-slate-800 leading-snug">{item.primary}</p>
              {item.secondary && <p className="text-xs text-slate-500 mt-0.5">{item.secondary}</p>}
              {item.tertiary && <p className="text-xs text-slate-400">{item.tertiary}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function normalizeSpecialty(s: string): string {
  if (!s?.trim()) return s
  const map: [RegExp, string][] = [
    [/^endo(crin(olog(ist|y)?)?)?$/i, 'Endocrinology'],
    [/^pcp$|^primary[\s-]?care([\s-]?physician)?$/i, 'Primary Care'],
    [/^internal[\s-]?med(icine)?$/i, 'Internal Medicine'],
    [/^family[\s-]?(med(icine)?|practice|physician)?$/i, 'Family Medicine'],
    [/^cardio(log(ist|y))?$/i, 'Cardiology'],
    [/^ophthalm(olog(ist|y))?$/i, 'Ophthalmology'],
    [/^podiatr(ist|y)$/i, 'Podiatry'],
    [/^neuro(log(ist|y))?$/i, 'Neurology'],
    [/^derm(atolog(ist|y))?$/i, 'Dermatology'],
  ]
  const t = s.trim()
  for (const [re, full] of map) { if (re.test(t)) return full }
  if (t === t.toLowerCase()) return t.charAt(0).toUpperCase() + t.slice(1)
  return t
}

function CareMapContent() {
  const router = useRouter()
  const [state, setStateLocal] = useState<AppState | null>(null)

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

  const { profile } = state
  const extended = state as any

  const prescribers = (extended.prescribers ?? [])
    .filter((p: any) => p.name?.trim())
    .map((p: any) => ({
      primary: p.name,
      secondary: [p.specialty && normalizeSpecialty(p.specialty), p.practice].filter(Boolean).join(' · '),
      tertiary: p.phone,
    }))

  const medications = state.medications.map(m => ({
    primary: [m.name, m.dosage].filter(Boolean).join(' '),
    secondary: m.prescriptionNumber ? `Rx ${m.prescriptionNumber}` : undefined,
    tertiary: m.frequency,
  }))

  const devices = (extended.devices ?? [])
    .filter((d: any) => d.devType?.trim())
    .map((d: any) => ({
      primary: [d.brand, d.model, d.devType].filter(Boolean).join(' '),
      secondary: d.pickupFrequency ? `Refill every ${d.pickupFrequency}` : undefined,
    }))

  const pharmacies = state.pharmacies.map(p => ({
    primary: p.name,
    secondary: p.address,
    tertiary: p.phone,
  }))

  const insurance = (extended.insurancePlans ?? [])
    .filter((p: any) => p.planName?.trim())
    .map((p: any) => ({
      primary: p.planName,
      secondary: [p.planType, p.coverageType].filter(Boolean).join(' · '),
      tertiary: p.memberId ? `Member ID: ${p.memberId}` : undefined,
    }))

  const manufacturers = (extended.manufacturers ?? [])
    .filter((m: any) => m.name?.trim())
    .map((m: any) => ({
      primary: m.name,
      secondary: m.phone,
    }))

  const hasData = prescribers.length + medications.length + devices.length + pharmacies.length + insurance.length + manufacturers.length > 0

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navigation patientName={profile?.name} />
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-slate-100 px-8 py-7">
          <div className="flex items-center gap-3">
            <Share2 className="w-5 h-5 text-slate-400" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">My Care Map</h1>
              <p className="text-sm text-slate-400 mt-0.5">Your full care network at a glance</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-7 max-w-4xl">
          {!hasData ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Share2 className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-500">No care network data yet</p>
              <p className="text-xs text-slate-400 mt-1">Complete onboarding to populate your care map.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CareCard icon={User}      title="Prescribers"          color="blue"   items={prescribers} />
              <CareCard icon={Pill}      title="Medications"          color="indigo" items={medications} />
              <CareCard icon={Cpu}       title="Devices"              color="cyan"   items={devices} />
              <CareCard icon={Building2} title="Pharmacies"           color="teal"   items={pharmacies} />
              <CareCard icon={Shield}    title="Insurance"            color="green"  items={insurance} />
              <CareCard icon={Phone}     title="Manufacturer Support" color="purple" items={manufacturers} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default function CareMapPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      </div>
    }>
      <CareMapContent />
    </Suspense>
  )
}
