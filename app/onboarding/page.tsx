'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  User, Pill, Building2, CheckCircle2, Plus, Trash2,
  ChevronRight, ChevronLeft, Heart, ArrowLeft
} from 'lucide-react'
import { setState } from '@/lib/storage'
import { generateWorkflowsFromOnboarding } from '@/lib/workflows'
import type { Medication, Pharmacy } from '@/lib/types'

const STEPS = [
  { id: 1, label: 'About you', icon: User, desc: 'Personal information' },
  { id: 2, label: 'Medications', icon: Pill, desc: 'Prescriptions to manage' },
  { id: 3, label: 'Pharmacy', icon: Building2, desc: 'Where we call' },
  { id: 4, label: 'Review', icon: CheckCircle2, desc: 'Confirm & launch' },
]

function uuid() { return Math.random().toString(36).slice(2) + Date.now().toString(36) }

const emptyMed = (): Omit<Medication, 'id'> => ({
  name: '', dosage: '', frequency: 'daily', prescriptionNumber: '',
  refillsRemaining: 3, lastFilled: new Date().toISOString().split('T')[0],
  daysSupply: 30, pharmacyId: '',
})

const emptyPharmacy = (): Omit<Pharmacy, 'id'> => ({ name: '', phone: '', address: '' })

function InputField({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
      <input
        {...props}
        className="w-full border border-slate-200 bg-white rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
      />
    </div>
  )
}

function SelectField({ label, children, ...props }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
      <select
        {...props}
        className="w-full border border-slate-200 bg-white rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
      >
        {children}
      </select>
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState({ name: '', dateOfBirth: '', phone: '', email: '' })
  const [medications, setMedications] = useState<Omit<Medication, 'id'>[]>([emptyMed()])
  const [pharmacies, setPharmacies] = useState<Omit<Pharmacy, 'id'>[]>([emptyPharmacy()])
  const [prefs, setPrefs] = useState({ callTimePreference: 'morning' as const, refillReminderDays: 7 })
  const [saving, setSaving] = useState(false)

  const canNext = () => {
    if (step === 1) return profile.name && profile.dateOfBirth && profile.phone && profile.email
    if (step === 2) return medications.every(m => m.name && m.prescriptionNumber)
    if (step === 3) return pharmacies.every(p => p.name && p.phone)
    return true
  }

  const handleFinish = () => {
    setSaving(true)
    const pharmaciesWithIds: Pharmacy[] = pharmacies.map(p => ({ ...p, id: uuid() }))
    const medicationsWithIds: Medication[] = medications.map(m => ({
      ...m, id: uuid(), pharmacyId: pharmaciesWithIds[0]?.id ?? '',
    }))
    const workflows = generateWorkflowsFromOnboarding(medicationsWithIds, pharmaciesWithIds, prefs.refillReminderDays)
    setState({
      profile: { ...profile, id: uuid(), createdAt: new Date().toISOString() },
      medications: medicationsWithIds,
      pharmacies: pharmaciesWithIds,
      workflows,
      messages: [],
      onboardingComplete: true,
    })
    router.push('/dashboard')
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <Heart className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-slate-900">Amphelo Health</span>
        </div>
        <div className="text-xs text-slate-400">Step {step} of {STEPS.length}</div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-200">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 py-12">
        {/* Step indicators */}
        <div className="flex items-center gap-3 mb-10">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const done = step > s.id
            const active = step === s.id
            return (
              <div key={s.id} className="flex items-center">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                  ${active ? 'bg-blue-600 text-white' : done ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-400'}`}>
                  {done
                    ? <CheckCircle2 className="w-3 h-3" />
                    : <Icon className="w-3 h-3" />
                  }
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-6 h-px mx-1 ${step > s.id ? 'bg-teal-400' : 'bg-slate-200'}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Card */}
        <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 card-shadow overflow-hidden">
          <div className="p-8">

            {/* Step 1 */}
            {step === 1 && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">Tell us about you</h2>
                  <p className="text-slate-500 text-sm">This is used to identify you to the pharmacy.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <InputField label="Full name" placeholder="Sarah Johnson" value={profile.name}
                      onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <InputField label="Date of birth" type="date" value={profile.dateOfBirth}
                    onChange={e => setProfile(p => ({ ...p, dateOfBirth: e.target.value }))} />
                  <InputField label="Phone number" type="tel" placeholder="555-234-7890" value={profile.phone}
                    onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
                  <div className="col-span-2">
                    <InputField label="Email address" type="email" placeholder="sarah@example.com" value={profile.email}
                      onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">Your medications</h2>
                  <p className="text-slate-500 text-sm">Add the prescriptions you'd like Amphelo to manage.</p>
                </div>
                <div className="space-y-4">
                  {medications.map((med, i) => (
                    <div key={i} className="border border-slate-200 rounded-xl p-5 bg-slate-50/50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-700">{i + 1}</span>
                          </div>
                          <span className="text-sm font-semibold text-slate-700">Medication {i + 1}</span>
                        </div>
                        {medications.length > 1 && (
                          <button onClick={() => setMedications(ms => ms.filter((_, idx) => idx !== i))}
                            className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <InputField label="Medication name" placeholder="Lisinopril" value={med.name}
                          onChange={e => setMedications(ms => ms.map((m, idx) => idx === i ? { ...m, name: e.target.value } : m))} />
                        <InputField label="Dosage" placeholder="10mg" value={med.dosage}
                          onChange={e => setMedications(ms => ms.map((m, idx) => idx === i ? { ...m, dosage: e.target.value } : m))} />
                        <InputField label="Prescription #" placeholder="RX-4829103" value={med.prescriptionNumber}
                          onChange={e => setMedications(ms => ms.map((m, idx) => idx === i ? { ...m, prescriptionNumber: e.target.value } : m))} />
                        <SelectField label="Day supply" value={med.daysSupply}
                          onChange={e => setMedications(ms => ms.map((m, idx) => idx === i ? { ...m, daysSupply: Number(e.target.value) } : m))}>
                          <option value={30}>30-day supply</option>
                          <option value={60}>60-day supply</option>
                          <option value={90}>90-day supply</option>
                        </SelectField>
                        <InputField label="Last filled" type="date" value={med.lastFilled}
                          onChange={e => setMedications(ms => ms.map((m, idx) => idx === i ? { ...m, lastFilled: e.target.value } : m))} />
                        <InputField label="Refills remaining" type="number" min={0} max={12} value={med.refillsRemaining}
                          onChange={e => setMedications(ms => ms.map((m, idx) => idx === i ? { ...m, refillsRemaining: Number(e.target.value) } : m))} />
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setMedications(ms => [...ms, emptyMed()])}
                    className="w-full border-2 border-dashed border-slate-200 rounded-xl py-3 text-sm text-slate-400 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />Add another medication
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">Your pharmacy</h2>
                  <p className="text-slate-500 text-sm">Amphelo will call this number to request refills.</p>
                </div>
                <div className="space-y-4">
                  {pharmacies.map((ph, i) => (
                    <div key={i} className="border border-slate-200 rounded-xl p-5 bg-slate-50/50">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-semibold text-slate-700">Pharmacy {i + 1}</span>
                        {pharmacies.length > 1 && (
                          <button onClick={() => setPharmacies(ps => ps.filter((_, idx) => idx !== i))}
                            className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <InputField label="Pharmacy name" placeholder="CVS Pharmacy" value={ph.name}
                          onChange={e => setPharmacies(ps => ps.map((p, idx) => idx === i ? { ...p, name: e.target.value } : p))} />
                        <InputField label="Phone number" type="tel" placeholder="555-123-4567" value={ph.phone}
                          onChange={e => setPharmacies(ps => ps.map((p, idx) => idx === i ? { ...p, phone: e.target.value } : p))} />
                        <div className="col-span-2">
                          <InputField label="Address (optional)" placeholder="123 Main St, Anytown" value={ph.address}
                            onChange={e => setPharmacies(ps => ps.map((p, idx) => idx === i ? { ...p, address: e.target.value } : p))} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setPharmacies(ps => [...ps, emptyPharmacy()])}
                    className="w-full border-2 border-dashed border-slate-200 rounded-xl py-3 text-sm text-slate-400 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />Add another pharmacy
                  </button>

                  {/* Preferences */}
                  <div className="border border-slate-200 rounded-xl p-5 bg-white">
                    <h3 className="text-sm font-semibold text-slate-800 mb-4">Call preferences</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <SelectField label="Preferred call time" value={prefs.callTimePreference}
                        onChange={e => setPrefs(p => ({ ...p, callTimePreference: e.target.value as any }))}>
                        <option value="morning">Morning (9–11am)</option>
                        <option value="afternoon">Afternoon (1–3pm)</option>
                        <option value="evening">Evening (4–6pm)</option>
                      </SelectField>
                      <SelectField label="Remind me before runout" value={prefs.refillReminderDays}
                        onChange={e => setPrefs(p => ({ ...p, refillReminderDays: Number(e.target.value) }))}>
                        <option value={3}>3 days before</option>
                        <option value={7}>7 days before</option>
                        <option value={14}>14 days before</option>
                      </SelectField>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4 */}
            {step === 4 && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">Review & launch</h2>
                  <p className="text-slate-500 text-sm">Everything looks good? We'll create your workflows automatically.</p>
                </div>
                <div className="space-y-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-semibold text-slate-700">Patient</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{profile.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{profile.email} · {profile.phone}</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Pill className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-semibold text-slate-700">{medications.length} Medication{medications.length !== 1 ? 's' : ''}</span>
                    </div>
                    {medications.map((m, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                        <span className="text-sm text-slate-800 font-medium">{m.name} {m.dosage}</span>
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Rx #{m.prescriptionNumber}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-semibold text-slate-700">Pharmacy</span>
                    </div>
                    {pharmacies.map((p, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                        <span className="text-sm text-slate-800 font-medium">{p.name}</span>
                        <span className="text-xs text-slate-400">{p.phone}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-teal-50 border border-blue-100 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-800">What happens next</span>
                    </div>
                    <p className="text-sm text-slate-600">
                      We'll create <strong>{medications.length} recurring refill workflow{medications.length !== 1 ? 's' : ''}</strong> —
                      one per medication. Each is pending your approval before any call is made.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer nav */}
          <div className="bg-slate-50 border-t border-slate-100 px-8 py-5 flex items-center justify-between">
            <button
              onClick={() => setStep(s => s - 1)}
              disabled={step === 1}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-xl hover:bg-white"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            {step < 4 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext()}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm shadow-blue-200"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-60 transition-all shadow-sm shadow-blue-200"
              >
                {saving ? 'Launching...' : 'Launch Amphelo'}
                <Heart className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
