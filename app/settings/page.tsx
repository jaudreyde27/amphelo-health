'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Trash2, Save, Pill, Cpu, User, Building2,
  Shield, Phone, Check, ChevronDown, ChevronUp,
} from 'lucide-react'
import Navigation from '@/components/Navigation'
import { getState, setState } from '@/lib/storage'

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36) }

// Field component
function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
      <input
        {...props}
        className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
      />
    </div>
  )
}

// Collapsible section
function Section({
  icon: Icon, title, color, count, children,
}: {
  icon: React.ElementType; title: string; color: string; count: number; children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600', indigo: 'bg-indigo-100 text-indigo-600',
    cyan: 'bg-cyan-100 text-cyan-600', teal: 'bg-teal-100 text-teal-600',
    green: 'bg-green-100 text-green-600', purple: 'bg-purple-100 text-purple-600',
  }
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color] ?? colors.blue}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-slate-900">{title}</p>
            <p className="text-xs text-slate-400">{count} {count === 1 ? 'entry' : 'entries'}</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">{children}</div>}
    </div>
  )
}

// Row separator
function Divider() { return <div className="border-t border-slate-100" /> }

export default function SettingsPage() {
  const router = useRouter()
  const [loaded, setLoaded] = useState(false)
  const [saved, setSaved] = useState(false)
  const [profile, setProfile] = useState<any>(null)

  // Standard AppState fields
  const [medications, setMedications] = useState<any[]>([])
  const [pharmacies, setPharmacies] = useState<any[]>([])

  // Extended state fields
  const [devices, setDevices] = useState<any[]>([])
  const [prescribers, setPrescribers] = useState<any[]>([])
  const [insurancePlans, setInsurancePlans] = useState<any[]>([])
  const [manufacturers, setManufacturers] = useState<any[]>([])

  useEffect(() => {
    const s = getState() as any
    if (!s.onboardingComplete) { router.replace('/onboarding'); return }
    setProfile(s.profile)
    setMedications((s.medications ?? []).map((m: any) => ({ ...m })))
    setPharmacies((s.pharmacies ?? []).map((p: any) => ({ ...p })))
    setDevices((s.devices ?? []).map((d: any) => ({ ...d })))
    setPrescribers((s.prescribers ?? []).map((p: any) => ({ ...p })))
    setInsurancePlans((s.insurancePlans ?? []).map((p: any) => ({ ...p })))
    setManufacturers((s.manufacturers ?? []).map((m: any) => ({ ...m })))
    setLoaded(true)
  }, [router])

  const handleSave = () => {
    setState({
      medications,
      pharmacies,
      ...({ devices, prescribers, insurancePlans, manufacturers } as any),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (!loaded) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navigation patientName={profile?.name} />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-slate-100 px-8 py-7 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
            <p className="text-sm text-slate-400 mt-1">View and update your care profile</p>
          </div>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm
              ${saved ? 'bg-teal-600 text-white shadow-teal-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'}`}
          >
            {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save changes</>}
          </button>
        </div>

        <div className="px-8 py-7 space-y-5 max-w-3xl">

          {/* Prescriptions */}
          <Section icon={Pill} title="Prescriptions" color="indigo" count={medications.length}>
            {medications.map((med, i) => (
              <div key={med.id ?? i}>
                {i > 0 && <Divider />}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <Field label="Medication name" value={med.name ?? ''}
                    onChange={e => setMedications(ms => ms.map((m, idx) => idx === i ? { ...m, name: e.target.value } : m))} />
                  <Field label="Format / dosage" value={med.dosage ?? ''}
                    placeholder="10mL vial"
                    onChange={e => setMedications(ms => ms.map((m, idx) => idx === i ? { ...m, dosage: e.target.value } : m))} />
                  <Field label="Refill frequency" value={med.frequency ?? ''}
                    placeholder="every 4 weeks"
                    onChange={e => setMedications(ms => ms.map((m, idx) => idx === i ? { ...m, frequency: e.target.value } : m))} />
                </div>
                <div className="flex justify-end pt-2">
                  <button onClick={() => setMedications(ms => ms.filter((_, idx) => idx !== i))}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={() => setMedications(ms => [...ms, { id: uid(), name: '', dosage: '', frequency: '', prescriptionNumber: '', refillsRemaining: 3, lastFilled: new Date().toISOString().split('T')[0], daysSupply: 30, pharmacyId: '' }])}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors pt-1">
              <Plus className="w-4 h-4" /> Add prescription
            </button>
          </Section>

          {/* Devices */}
          <Section icon={Cpu} title="Devices" color="cyan" count={devices.length}>
            {devices.length === 0 && (
              <p className="text-sm text-slate-400 py-1">No devices added.</p>
            )}
            {devices.map((d, i) => (
              <div key={d.id ?? i}>
                {i > 0 && <Divider />}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <Field label="Device type" value={d.devType ?? ''}
                    placeholder="CGM"
                    onChange={e => setDevices(ds => ds.map((x, idx) => idx === i ? { ...x, devType: e.target.value } : x))} />
                  <Field label="Brand" value={d.brand ?? ''}
                    placeholder="Dexcom"
                    onChange={e => setDevices(ds => ds.map((x, idx) => idx === i ? { ...x, brand: e.target.value } : x))} />
                  <Field label="Model" value={d.model ?? ''}
                    placeholder="G7"
                    onChange={e => setDevices(ds => ds.map((x, idx) => idx === i ? { ...x, model: e.target.value } : x))} />
                </div>
                <div className="flex justify-end pt-2">
                  <button onClick={() => setDevices(ds => ds.filter((_, idx) => idx !== i))}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={() => setDevices(ds => [...ds, { id: uid(), devType: '', brand: '', model: '' }])}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors pt-1">
              <Plus className="w-4 h-4" /> Add device
            </button>
          </Section>

          {/* Prescribers */}
          <Section icon={User} title="Prescribers" color="blue" count={prescribers.length}>
            {prescribers.length === 0 && (
              <p className="text-sm text-slate-400 py-1">No prescribers added.</p>
            )}
            {prescribers.map((p, i) => (
              <div key={p.id ?? i}>
                {i > 0 && <Divider />}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Field label="Full name" value={p.name ?? ''}
                    placeholder="Dr. Sarah Smith"
                    onChange={e => setPrescribers(ps => ps.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} />
                  <Field label="Specialty" value={p.specialty ?? ''}
                    placeholder="Endocrinology"
                    onChange={e => setPrescribers(ps => ps.map((x, idx) => idx === i ? { ...x, specialty: e.target.value } : x))} />
                  <Field label="Practice / clinic" value={p.practice ?? ''}
                    placeholder="Diabetes Care Center"
                    onChange={e => setPrescribers(ps => ps.map((x, idx) => idx === i ? { ...x, practice: e.target.value } : x))} />
                  <Field label="Phone number" type="tel" value={p.phone ?? ''}
                    placeholder="555-123-4567"
                    onChange={e => setPrescribers(ps => ps.map((x, idx) => idx === i ? { ...x, phone: e.target.value } : x))} />
                  <Field label="Visit frequency" value={p.visitFrequency ?? ''}
                    placeholder="Every 3 months"
                    onChange={e => setPrescribers(ps => ps.map((x, idx) => idx === i ? { ...x, visitFrequency: e.target.value } : x))} />
                  <Field label="Last visit date" type="date" value={p.lastVisit ?? ''}
                    onChange={e => setPrescribers(ps => ps.map((x, idx) => idx === i ? { ...x, lastVisit: e.target.value } : x))} />
                </div>
                {p.nextVisitScheduled && (
                  <div className="pt-2 max-w-xs">
                    <Field label="Next visit date" type="date" value={p.nextVisitDate ?? ''}
                      onChange={e => setPrescribers(ps => ps.map((x, idx) => idx === i ? { ...x, nextVisitDate: e.target.value } : x))} />
                  </div>
                )}
                <div className="flex justify-end pt-2">
                  <button onClick={() => setPrescribers(ps => ps.filter((_, idx) => idx !== i))}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={() => setPrescribers(ps => [...ps, { id: uid(), name: '', specialty: '', practice: '', phone: '', manages: [], visitFrequency: '', lastVisit: '', nextVisitScheduled: false, nextVisitDate: '' }])}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors pt-1">
              <Plus className="w-4 h-4" /> Add prescriber
            </button>
          </Section>

          {/* Pharmacies */}
          <Section icon={Building2} title="Pharmacies" color="teal" count={pharmacies.length}>
            {pharmacies.map((ph, i) => (
              <div key={ph.id ?? i}>
                {i > 0 && <Divider />}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Field label="Pharmacy name" value={ph.name ?? ''}
                    placeholder="CVS"
                    onChange={e => setPharmacies(ps => ps.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} />
                  <Field label="Phone number" type="tel" value={ph.phone ?? ''}
                    placeholder="555-123-4567"
                    onChange={e => setPharmacies(ps => ps.map((x, idx) => idx === i ? { ...x, phone: e.target.value } : x))} />
                  <div className="col-span-2">
                    <Field label="Address" value={ph.address ?? ''}
                      placeholder="100 Main St, New York"
                      onChange={e => setPharmacies(ps => ps.map((x, idx) => idx === i ? { ...x, address: e.target.value } : x))} />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button onClick={() => setPharmacies(ps => ps.filter((_, idx) => idx !== i))}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={() => setPharmacies(ps => [...ps, { id: uid(), name: '', phone: '', address: '' }])}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors pt-1">
              <Plus className="w-4 h-4" /> Add pharmacy
            </button>
          </Section>

          {/* Insurance */}
          <Section icon={Shield} title="Insurance" color="green" count={insurancePlans.length}>
            {insurancePlans.length === 0 && (
              <p className="text-sm text-slate-400 py-1">No insurance plans added.</p>
            )}
            {insurancePlans.map((plan, i) => (
              <div key={plan.id ?? i}>
                {i > 0 && <Divider />}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Field label="Plan name" value={plan.planName ?? ''}
                    placeholder="BlueCross BlueShield"
                    onChange={e => setInsurancePlans(ps => ps.map((x, idx) => idx === i ? { ...x, planName: e.target.value } : x))} />
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Plan type</label>
                    <select value={plan.planType ?? 'Medical'}
                      onChange={e => setInsurancePlans(ps => ps.map((x, idx) => idx === i ? { ...x, planType: e.target.value } : x))}
                      className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {['Medical', 'Part D', 'Medicaid', 'Medicare', 'Other'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <Field label="Member ID" value={plan.memberId ?? ''}
                    placeholder="XYZ123456"
                    onChange={e => setInsurancePlans(ps => ps.map((x, idx) => idx === i ? { ...x, memberId: e.target.value } : x))} />
                  <Field label="Group number" value={plan.groupNumber ?? ''}
                    placeholder="GRP001"
                    onChange={e => setInsurancePlans(ps => ps.map((x, idx) => idx === i ? { ...x, groupNumber: e.target.value } : x))} />
                  <Field label="Insurance phone (member services)" type="tel" value={plan.phone ?? ''}
                    placeholder="1-800-555-0000"
                    onChange={e => setInsurancePlans(ps => ps.map((x, idx) => idx === i ? { ...x, phone: e.target.value } : x))} />
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Coverage type</label>
                    <div className="flex gap-2">
                      {['Primary', 'Secondary'].map(ct => (
                        <button key={ct}
                          onClick={() => setInsurancePlans(ps => ps.map((x, idx) => idx === i ? { ...x, coverageType: ct } : x))}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium border transition
                            ${(plan.coverageType ?? 'Primary') === ct ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
                          {ct}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button onClick={() => setInsurancePlans(ps => ps.filter((_, idx) => idx !== i))}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={() => setInsurancePlans(ps => [...ps, { id: uid(), planName: '', planType: 'Medical', memberId: '', groupNumber: '', phone: '', coverageType: 'Primary' }])}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors pt-1">
              <Plus className="w-4 h-4" /> Add insurance plan
            </button>
          </Section>

          {/* Manufacturer Support */}
          <Section icon={Phone} title="Manufacturer Support" color="purple" count={manufacturers.length}>
            {manufacturers.length === 0 && (
              <p className="text-sm text-slate-400 py-1">No manufacturer contacts added.</p>
            )}
            {manufacturers.map((m, i) => (
              <div key={m.id ?? i}>
                {i > 0 && <Divider />}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Field label="Manufacturer name" value={m.name ?? ''}
                    placeholder="Dexcom"
                    onChange={e => setManufacturers(ms => ms.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} />
                  <Field label="Customer service phone" type="tel" value={m.phone ?? ''}
                    placeholder="1-844-607-8398"
                    onChange={e => setManufacturers(ms => ms.map((x, idx) => idx === i ? { ...x, phone: e.target.value } : x))} />
                </div>
                <div className="flex justify-end pt-2">
                  <button onClick={() => setManufacturers(ms => ms.filter((_, idx) => idx !== i))}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={() => setManufacturers(ms => [...ms, { id: uid(), name: '', phone: '' }])}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors pt-1">
              <Plus className="w-4 h-4" /> Add manufacturer
            </button>
          </Section>

          {/* Save reminder at bottom */}
          <div className="flex justify-end pb-6">
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-sm
                ${saved ? 'bg-teal-600 text-white shadow-teal-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'}`}
            >
              {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save changes</>}
            </button>
          </div>

        </div>
      </main>
    </div>
  )
}
