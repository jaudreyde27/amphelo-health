'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Heart, ArrowLeft, Plus, Trash2, ChevronRight, Check } from 'lucide-react'
import { setState } from '@/lib/storage'
import { generateWorkflowsFromOnboarding } from '@/lib/workflows'
import type { Medication, Pharmacy, Workflow } from '@/lib/types'

// --- Local types ---
type SubmittingFor = 'myself' | 'someone_else'
interface RxEntry { id: string; name: string; format: string; refillFrequency: string }
interface DeviceEntry { id: string; devType: string; brand: string; model: string }
interface ManufacturerEntry { id: string; name: string; phone: string }
interface PrescriberEntry {
  id: string; name: string; specialty: string; practice: string; phone: string; manages: string[]
  visitFrequency: string; lastVisit: string; nextVisitScheduled: boolean; nextVisitDate: string
}
interface PharmEntry {
  id: string; pharmName: string; pharmAddress: string; pharmCity: string; phone: string; isPrimary: boolean
  fills: string[]
  hasMailOrder: boolean; mailName: string; mailPhone: string; mailMeds: string[]
}
interface InsurPlan { id: string; planName: string; planType: string; memberId: string; groupNumber: string; phone: string; coverageType: string }
interface PriorAuth { id: string; item: string; expDate: string }
interface ChatMsg { id: string; role: 'ai' | 'user'; content: string }

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36) }

const CONDITIONS = [
  'Type 1 Diabetes', 'Type 2 Diabetes', 'Multiple Sclerosis', "Crohn's Disease",
  'Rheumatoid Arthritis', 'Lupus', 'Psoriasis', 'COPD', 'Heart Failure', 'Asthma',
  'Cancer', 'HIV/AIDS', 'Hepatitis C', 'Cystic Fibrosis',
]

// Steps 0-14 → phase 0-6
// 0=Identity, 1=Prescriptions, 2=Devices, 3=Prescribers, 4=Pharmacy, 5=Insurance, 6=Review
const PHASE_LABELS = ['Identity', 'Prescriptions', 'Devices', 'Prescribers', 'Pharmacy', 'Insurance', 'Review']
const STEP_TO_PHASE = [0, 0, 0, 1, 2, 2, 2, 2, 3, 4, 5, 5, 5, 5, 6]

// --- Field ---
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

// --- Chat bubbles ---
function AiBubble({ text }: { text: string }) {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center shrink-0 mb-0.5">
        <Heart className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[85%]">
        <p className="text-sm text-slate-800 leading-relaxed">{text}</p>
      </div>
    </div>
  )
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end mb-3">
      <div className="bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[85%]">
        <p className="text-sm leading-relaxed whitespace-pre-line">{text}</p>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
        <Heart className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1 items-center">
          {[0, 1, 2].map(i => (
            <span key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function FormCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="pl-9 mt-1 mb-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">{children}</div>
    </div>
  )
}

function SendRow({ onSend, disabled, label = 'Continue', onAdd, addLabel }: {
  onSend: () => void; disabled?: boolean; label?: string; onAdd?: () => void; addLabel?: string
}) {
  return (
    <div className="flex items-center justify-between pt-1">
      {onAdd ? (
        <button onClick={onAdd} className="text-xs text-slate-400 hover:text-blue-600 flex items-center gap-1 transition">
          <Plus className="w-3.5 h-3.5" /> {addLabel ?? 'Add another'}
        </button>
      ) : <div />}
      <button onClick={onSend} disabled={disabled}
        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-blue-700 transition flex items-center gap-1">
        {label} <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function TagSelect({ label, items, selected, onToggle }: {
  label: string; items: string[]; selected: string[]; onToggle: (item: string) => void
}) {
  if (items.length === 0) return null
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {items.map(item => {
          const active = selected.includes(item)
          return (
            <button key={item} onClick={() => onToggle(item)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition
                ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
              {item}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// --- Main ---
export default function OnboardingPage() {
  const router = useRouter()
  const [chatLog, setChatLog] = useState<ChatMsg[]>([])
  const [typing, setTyping] = useState(false)
  const [step, setStep] = useState(-1)
  const [saving, setSaving] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Data
  const [submittingFor, setSubmittingFor] = useState<SubmittingFor>('myself')
  const [patientName, setPatientName] = useState('')
  const [condition, setCondition] = useState('')
  const [rxEntries, setRxEntries] = useState<RxEntry[]>([{ id: uid(), name: '', format: '', refillFrequency: '' }])
  const [hasDevices, setHasDevices] = useState<boolean | null>(null)
  const [deviceEntries, setDeviceEntries] = useState<DeviceEntry[]>([{ id: uid(), devType: '', brand: '', model: '' }])
  const [hasManufacturers, setHasManufacturers] = useState<boolean | null>(null)
  const [manufacturerEntries, setManufacturerEntries] = useState<ManufacturerEntry[]>([{ id: uid(), name: '', phone: '' }])
  const [prescriberEntries, setPrescriberEntries] = useState<PrescriberEntry[]>([{
    id: uid(), name: '', specialty: '', practice: '', phone: '', manages: [],
    visitFrequency: '', lastVisit: '', nextVisitScheduled: false, nextVisitDate: '',
  }])
  const [pharmEntries, setPharmEntries] = useState<PharmEntry[]>([{
    id: uid(), pharmName: '', pharmAddress: '', pharmCity: '', phone: '', isPrimary: true,
    fills: [],
    hasMailOrder: false, mailName: '', mailPhone: '', mailMeds: [],
  }])
  const [insurPlans, setInsurPlans] = useState<InsurPlan[]>([{ id: uid(), planName: '', planType: 'Medical', memberId: '', groupNumber: '', phone: '', coverageType: 'Primary' }])
  const [paStatus, setPaStatus] = useState<'yes' | 'no' | 'not_sure' | null>(null)
  const [priorAuths, setPriorAuths] = useState<PriorAuth[]>([{ id: uid(), item: '', expDate: '' }])
  const [coverageNotes, setCoverageNotes] = useState('')

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatLog, typing, step])

  useEffect(() => {
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setChatLog([{ id: uid(), role: 'ai', content: "Hi! I'm your Amphelo care coordinator. I'll help set up your profile in just a few minutes. First — are you setting this up for yourself, or for someone else?" }])
      setStep(0)
    }, 1000)
  }, [])

  const userSay = (text: string) => setChatLog(log => [...log, { id: uid(), role: 'user', content: text }])
  const aiSay = (text: string, nextStep: number, delay = 850) => {
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setChatLog(log => [...log, { id: uid(), role: 'ai', content: text }])
      setStep(nextStep)
    }, delay)
  }

  const isMyself = submittingFor === 'myself'
  const their = isMyself ? 'your' : 'their'
  const they = isMyself ? 'you' : 'they'
  const areThey = isMyself ? 'are you' : 'are they'

  // All named items for multiselects
  const allRxNames = rxEntries.filter(r => r.name.trim()).map(r => r.name)
  const allDeviceNames = hasDevices ? deviceEntries.filter(d => d.devType.trim()).map(d => `${d.brand} ${d.devType}`.trim()) : []
  const allMedDevItems = [...allRxNames, ...allDeviceNames]

  // Handlers
  const handleSubmittingFor = (val: SubmittingFor) => {
    setSubmittingFor(val)
    userSay(val === 'myself' ? 'For myself' : 'For someone else')
    aiSay(`Got it! What's ${val === 'myself' ? 'your' : 'their'} full name?`, 1)
  }

  const handleName = () => {
    if (!patientName.trim()) return
    userSay(patientName)
    const first = patientName.split(' ')[0]
    const q = isMyself ? 'are you managing' : 'are they managing'
    aiSay(`Nice to meet you, ${first}! What condition ${q}?`, 2)
  }

  const handleCondition = () => {
    if (!condition.trim()) return
    userSay(condition)
    aiSay(`Understood. Now let's add ${their} prescriptions — name, format (e.g. "10mL vial", "30-count pills"), and refill frequency (e.g. "every 4 weeks").`, 3)
  }

  const handleRx = () => {
    const valid = rxEntries.filter(r => r.name.trim())
    if (valid.length === 0) return
    userSay(valid.map(r => [r.name, r.format, r.refillFrequency].filter(Boolean).join(' · ')).join('\n'))
    aiSay(`Got it! Does ${their} care involve any medical devices? (e.g. CGM, insulin pump, infusion pump)`, 4)
  }

  const handleDeviceYesNo = (val: boolean) => {
    setHasDevices(val)
    userSay(val ? 'Yes, I use medical devices' : 'No devices')
    if (val) {
      aiSay(`Tell me about each device — type, brand, and model.`, 5)
    } else {
      aiSay(`Got it. Do you ever contact ${their} medication or device manufacturer directly for support or reorders? (e.g. Dexcom, Omnipod, Lilly)`, 6)
    }
  }

  const handleDevices = () => {
    const valid = deviceEntries.filter(d => d.devType.trim())
    if (valid.length === 0) return
    userSay(valid.map(d => [d.brand, d.devType, d.model].filter(Boolean).join(' ')).join('\n'))
    aiSay(`Got it. Do you ever contact ${their} medication or device manufacturer directly for support or reorders? (e.g. Dexcom, Omnipod, Lilly)`, 6)
  }

  const handleManufacturerYesNo = (val: boolean) => {
    setHasManufacturers(val)
    userSay(val ? 'Yes, I contact manufacturers directly' : 'No manufacturer contacts')
    if (val) {
      aiSay(`Great. Add each manufacturer's name and their customer service number.`, 7)
    } else {
      aiSay(`No problem. Now, who ${areThey} the prescribers managing ${their} care?`, 8)
    }
  }

  const handleManufacturers = () => {
    const valid = manufacturerEntries.filter(m => m.name.trim())
    if (valid.length === 0) return
    userSay(valid.map(m => [m.name, m.phone].filter(Boolean).join(' — ')).join('\n'))
    aiSay(`Saved. Now, who ${areThey} the prescribers managing ${their} care?`, 8)
  }

  const handlePrescribers = () => {
    const valid = prescriberEntries.filter(p => p.name.trim())
    if (valid.length === 0) return
    userSay(valid.map(p => [p.name, p.specialty && `(${p.specialty})`, p.practice && `at ${p.practice}`].filter(Boolean).join(' ')).join('\n'))
    aiSay(`Perfect. Where does ${they} fill ${their} prescriptions and pick up ${their} devices?`, 9)
  }

  const handlePharmacies = () => {
    const valid = pharmEntries.filter(p => p.pharmName.trim())
    if (valid.length === 0) return
    userSay(valid.map(p => [[p.pharmName, p.pharmCity].filter(Boolean).join(', '), p.phone && `— ${p.phone}`, p.isPrimary && '(primary)', p.hasMailOrder && '+ mail order'].filter(Boolean).join(' ')).join('\n'))
    aiSay(`Almost done — let's capture ${their} insurance information.`, 10)
  }

  const handleInsurance = () => {
    const valid = insurPlans.filter(p => p.planName.trim())
    userSay(valid.length > 0
      ? valid.map(p => [p.planName, `(${p.planType})`, p.memberId && `ID: ${p.memberId}`, `— ${p.coverageType}`].filter(Boolean).join(' ')).join('\n')
      : 'Insurance information added')
    aiSay(`Do any of ${their} medications or devices require prior authorization?`, 11)
  }

  const handlePaStatus = (val: 'yes' | 'no' | 'not_sure') => {
    setPaStatus(val)
    userSay({ yes: 'Yes, some require prior auth', no: 'No prior auth needed', not_sure: 'Not sure' }[val])
    if (val === 'yes') {
      aiSay(`Which medications or devices require prior authorization?`, 12)
    } else {
      aiSay(`One last thing — anything else I should know about ${their} coverage? (copay programs, manufacturer assistance, appeals, etc.) You can skip this.`, 13)
    }
  }

  const handlePriorAuths = () => {
    const valid = priorAuths.filter(p => p.item.trim())
    if (valid.length === 0) return
    userSay(valid.map(p => [p.item, p.expDate && `(expires ${p.expDate})`].filter(Boolean).join(' ')).join('\n'))
    aiSay(`One last thing — anything else I should know about ${their} coverage? You can skip this.`, 13)
  }

  const handleCoverageNotes = () => {
    userSay(coverageNotes.trim() || 'No additional notes')
    aiSay(`All set! Here's a summary of everything I've captured. Review and launch when ready.`, 14)
  }

  const handleFinish = () => {
    setSaving(true)
    const makeId = () => uid()

    const pharmaciesWithIds: Pharmacy[] = pharmEntries
      .filter(p => p.pharmName.trim())
      .map(p => ({ id: makeId(), name: p.pharmName, phone: p.phone, address: [p.pharmAddress, p.pharmCity].filter(Boolean).join(', ') }))

    const primaryPharmacy = pharmaciesWithIds[0]

    // Find which pharmacy supplies a given item name (using the fills multiselect)
    const pharmForItem = (itemName: string): Pharmacy => {
      const entryIdx = pharmEntries.findIndex(ph => ph.fills.includes(itemName))
      return (entryIdx >= 0 ? pharmaciesWithIds[entryIdx] : undefined) ?? primaryPharmacy
    }

    const medicationsWithIds: Medication[] = rxEntries.filter(r => r.name.trim()).map(r => {
      const pharm = pharmForItem(r.name)
      return {
        id: makeId(), name: r.name, dosage: r.format, frequency: r.refillFrequency,
        prescriptionNumber: '', refillsRemaining: 3,
        lastFilled: new Date().toISOString().split('T')[0],
        daysSupply: 30, pharmacyId: pharm?.id ?? '',
      }
    })

    const medWorkflows = generateWorkflowsFromOnboarding(medicationsWithIds, pharmaciesWithIds, 7)

    // Device workflows — devices are pharmacy pickups too
    const deviceWorkflows: Workflow[] = hasDevices
      ? deviceEntries.filter(d => d.devType.trim()).map(d => {
          const itemName = `${d.brand} ${d.devType}`.trim()
          const pharm = pharmForItem(itemName)
          return {
            id: makeId(), type: 'refill' as const,
            title: `Reorder ${[d.brand, d.devType].filter(Boolean).join(' ')}`,
            description: `Call ${pharm?.name ?? 'pharmacy'} to reorder ${[d.brand, d.devType, d.model].filter(Boolean).join(' ')}`,
            medicationId: undefined,
            medicationName: [d.brand, d.devType, d.model].filter(Boolean).join(' '),
            pharmacyId: pharm?.id ?? '', pharmacyName: pharm?.name ?? '', pharmacyPhone: pharm?.phone ?? '',
            status: 'needs_approval' as const,
            scheduledAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            isRecurring: true, recurringInterval: 'monthly' as const,
            createdAt: new Date().toISOString(),
          }
        })
      : []

    setState({
      profile: { id: makeId(), name: patientName, dateOfBirth: '', phone: '', email: '', createdAt: new Date().toISOString() },
      medications: medicationsWithIds,
      pharmacies: pharmaciesWithIds,
      workflows: [...medWorkflows, ...deviceWorkflows],
      messages: [],
      onboardingComplete: true,
      ...({
        condition, submittingFor,
        devices: deviceEntries,
        manufacturers: manufacturerEntries,
        prescribers: prescriberEntries,
        insurancePlans: insurPlans,
        priorAuths, coverageNotes,
      } as any),
    })
    router.push('/dashboard')
  }

  const currentPhase = step >= 0 ? (STEP_TO_PHASE[Math.min(step, 14)] ?? 6) : 0

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between shrink-0">
        <Link href="/" className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <Heart className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-slate-900">Amphelo</span>
        </div>
        <div className="text-xs text-slate-400">{currentPhase + 1} of 7</div>
      </div>

      {/* Progress */}
      <div className="bg-white border-b border-slate-100 px-4 py-2.5 shrink-0 overflow-x-auto">
        <div className="flex items-center justify-center gap-1.5 min-w-max mx-auto">
          {PHASE_LABELS.map((label, i) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all
                ${i < currentPhase ? 'bg-teal-50 text-teal-700' : i === currentPhase ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {i < currentPhase && <Check className="w-2.5 h-2.5" />}
                {label}
              </div>
              {i < PHASE_LABELS.length - 1 && <div className={`w-3 h-px ${i < currentPhase ? 'bg-teal-300' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl w-full mx-auto">
        {chatLog.map(msg =>
          msg.role === 'ai' ? <AiBubble key={msg.id} text={msg.content} /> : <UserBubble key={msg.id} text={msg.content} />
        )}
        {typing && <TypingIndicator />}

        {/* Step 0: Submitting for */}
        {!typing && step === 0 && (
          <div className="flex gap-2 mt-1 mb-4 pl-9 flex-wrap">
            <button onClick={() => handleSubmittingFor('myself')} className="px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-100 transition">For myself</button>
            <button onClick={() => handleSubmittingFor('someone_else')} className="px-4 py-2 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition">For someone else</button>
          </div>
        )}

        {/* Step 1: Name */}
        {!typing && step === 1 && (
          <div className="pl-9 mt-1 mb-4">
            <div className="flex gap-2">
              <input type="text" autoFocus
                className="flex-1 border border-slate-200 bg-white rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={submittingFor === 'myself' ? 'Your full name' : 'Their full name'}
                value={patientName} onChange={e => setPatientName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleName()} />
              <button onClick={handleName} disabled={!patientName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-blue-700 transition flex items-center gap-1">
                Send <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Condition */}
        {!typing && step === 2 && (
          <div className="pl-9 mt-1 mb-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <input type="text" list="conditions-list" autoFocus
                  className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type 1 Diabetes, MS, Crohn's…"
                  value={condition} onChange={e => setCondition(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCondition()} />
                <datalist id="conditions-list">{CONDITIONS.map(c => <option key={c} value={c} />)}</datalist>
              </div>
              <button onClick={handleCondition} disabled={!condition.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-blue-700 transition flex items-center gap-1">
                Send <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Prescriptions */}
        {!typing && step === 3 && (
          <FormCard>
            {rxEntries.map((rx, i) => (
              <div key={rx.id} className="space-y-2">
                {rxEntries.length > 1 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">Prescription {i + 1}</span>
                    <button onClick={() => setRxEntries(es => es.filter(e => e.id !== rx.id))} className="text-slate-300 hover:text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2">
                  <Field label="Medication name" placeholder="Humalog" value={rx.name}
                    onChange={e => setRxEntries(es => es.map(r => r.id === rx.id ? { ...r, name: e.target.value } : r))} />
                  <Field label="Format" placeholder="10mL vial" value={rx.format}
                    onChange={e => setRxEntries(es => es.map(r => r.id === rx.id ? { ...r, format: e.target.value } : r))} />
                  <Field label="Refill frequency" placeholder="every 4 weeks" value={rx.refillFrequency}
                    onChange={e => setRxEntries(es => es.map(r => r.id === rx.id ? { ...r, refillFrequency: e.target.value } : r))} />
                </div>
                {i < rxEntries.length - 1 && <div className="border-t border-slate-100 pt-1" />}
              </div>
            ))}
            <SendRow onSend={handleRx} disabled={!rxEntries.some(r => r.name.trim())}
              onAdd={() => setRxEntries(es => [...es, { id: uid(), name: '', format: '', refillFrequency: '' }])}
              addLabel="Add another prescription" />
          </FormCard>
        )}

        {/* Step 4: Devices yes/no */}
        {!typing && step === 4 && (
          <div className="flex gap-2 mt-1 mb-4 pl-9">
            <button onClick={() => handleDeviceYesNo(true)} className="px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-100 transition">Yes, I use devices</button>
            <button onClick={() => handleDeviceYesNo(false)} className="px-4 py-2 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition">No devices</button>
          </div>
        )}

        {/* Step 5: Devices form */}
        {!typing && step === 5 && (
          <FormCard>
            {deviceEntries.map((d, i) => (
              <div key={d.id} className="space-y-2">
                {deviceEntries.length > 1 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">Device {i + 1}</span>
                    <button onClick={() => setDeviceEntries(es => es.filter(e => e.id !== d.id))} className="text-slate-300 hover:text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2">
                  <Field label="Device type" placeholder="CGM" value={d.devType}
                    onChange={e => setDeviceEntries(es => es.map(x => x.id === d.id ? { ...x, devType: e.target.value } : x))} />
                  <Field label="Brand" placeholder="Dexcom" value={d.brand}
                    onChange={e => setDeviceEntries(es => es.map(x => x.id === d.id ? { ...x, brand: e.target.value } : x))} />
                  <Field label="Model" placeholder="G7" value={d.model}
                    onChange={e => setDeviceEntries(es => es.map(x => x.id === d.id ? { ...x, model: e.target.value } : x))} />
                </div>
                {i < deviceEntries.length - 1 && <div className="border-t border-slate-100 pt-1" />}
              </div>
            ))}
            <SendRow onSend={handleDevices} disabled={!deviceEntries.some(d => d.devType.trim())}
              onAdd={() => setDeviceEntries(es => [...es, { id: uid(), devType: '', brand: '', model: '' }])}
              addLabel="Add another device" />
          </FormCard>
        )}

        {/* Step 6: Manufacturer yes/no */}
        {!typing && step === 6 && (
          <div className="flex gap-2 mt-1 mb-4 pl-9 flex-wrap">
            <button onClick={() => handleManufacturerYesNo(true)} className="px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-100 transition">Yes, I contact manufacturers</button>
            <button onClick={() => handleManufacturerYesNo(false)} className="px-4 py-2 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition">No, skip</button>
          </div>
        )}

        {/* Step 7: Manufacturer contacts */}
        {!typing && step === 7 && (
          <FormCard>
            {manufacturerEntries.map((m, i) => (
              <div key={m.id} className="space-y-2">
                {manufacturerEntries.length > 1 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">Manufacturer {i + 1}</span>
                    <button onClick={() => setManufacturerEntries(es => es.filter(e => e.id !== m.id))} className="text-slate-300 hover:text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Manufacturer name" placeholder="Dexcom" value={m.name}
                    onChange={e => setManufacturerEntries(es => es.map(x => x.id === m.id ? { ...x, name: e.target.value } : x))} />
                  <Field label="Customer service phone" type="tel" placeholder="1-844-607-8398" value={m.phone}
                    onChange={e => setManufacturerEntries(es => es.map(x => x.id === m.id ? { ...x, phone: e.target.value } : x))} />
                </div>
                {i < manufacturerEntries.length - 1 && <div className="border-t border-slate-100 pt-1" />}
              </div>
            ))}
            <SendRow onSend={handleManufacturers} disabled={!manufacturerEntries.some(m => m.name.trim())}
              onAdd={() => setManufacturerEntries(es => [...es, { id: uid(), name: '', phone: '' }])}
              addLabel="Add another manufacturer" />
          </FormCard>
        )}

        {/* Step 8: Prescribers */}
        {!typing && step === 8 && (
          <FormCard>
            {prescriberEntries.map((p, i) => (
              <div key={p.id} className="space-y-2">
                {prescriberEntries.length > 1 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">Prescriber {i + 1}</span>
                    <button onClick={() => setPrescriberEntries(es => es.filter(e => e.id !== p.id))} className="text-slate-300 hover:text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Full name" placeholder="Dr. Sarah Smith" value={p.name}
                    onChange={e => setPrescriberEntries(es => es.map(x => x.id === p.id ? { ...x, name: e.target.value } : x))} />
                  <Field label="Specialty" placeholder="Endocrinology" value={p.specialty}
                    onChange={e => setPrescriberEntries(es => es.map(x => x.id === p.id ? { ...x, specialty: e.target.value } : x))} />
                  <Field label="Practice / clinic" placeholder="Diabetes Care Center" value={p.practice}
                    onChange={e => setPrescriberEntries(es => es.map(x => x.id === p.id ? { ...x, practice: e.target.value } : x))} />
                  <Field label="Phone number" type="tel" placeholder="555-123-4567" value={p.phone}
                    onChange={e => setPrescriberEntries(es => es.map(x => x.id === p.id ? { ...x, phone: e.target.value } : x))} />
                  <Field label="Visit frequency" placeholder="Every 3 months" value={p.visitFrequency}
                    onChange={e => setPrescriberEntries(es => es.map(x => x.id === p.id ? { ...x, visitFrequency: e.target.value } : x))} />
                  <Field label="Date of last visit" type="date" value={p.lastVisit}
                    onChange={e => setPrescriberEntries(es => es.map(x => x.id === p.id ? { ...x, lastVisit: e.target.value } : x))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Next visit scheduled?</label>
                  <div className="flex gap-2 items-center">
                    <div className="flex gap-2">
                      {[true, false].map(v => (
                        <button key={String(v)} onClick={() => setPrescriberEntries(es => es.map(x => x.id === p.id ? { ...x, nextVisitScheduled: v } : x))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition
                            ${p.nextVisitScheduled === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
                          {v ? 'Yes' : 'No'}
                        </button>
                      ))}
                    </div>
                    {p.nextVisitScheduled && (
                      <div className="flex-1">
                        <Field label="" placeholder="Upcoming date" type="date" value={p.nextVisitDate}
                          onChange={e => setPrescriberEntries(es => es.map(x => x.id === p.id ? { ...x, nextVisitDate: e.target.value } : x))} />
                      </div>
                    )}
                  </div>
                </div>
                {allMedDevItems.length > 0 && (
                  <TagSelect label="Which medications or devices do they manage?"
                    items={allMedDevItems} selected={p.manages}
                    onToggle={item => setPrescriberEntries(es => es.map(x => {
                      if (x.id !== p.id) return x
                      return { ...x, manages: x.manages.includes(item) ? x.manages.filter(m => m !== item) : [...x.manages, item] }
                    }))} />
                )}
                {i < prescriberEntries.length - 1 && <div className="border-t border-slate-100 pt-1" />}
              </div>
            ))}
            <SendRow onSend={handlePrescribers} disabled={!prescriberEntries.some(p => p.name.trim())}
              onAdd={() => setPrescriberEntries(es => [...es, { id: uid(), name: '', specialty: '', practice: '', phone: '', manages: [], visitFrequency: '', lastVisit: '', nextVisitScheduled: false, nextVisitDate: '' }])}
              addLabel="Add another prescriber" />
          </FormCard>
        )}

        {/* Step 9: Pharmacies */}
        {!typing && step === 9 && (
          <FormCard>
            {pharmEntries.map((ph, i) => (
              <div key={ph.id} className="space-y-2">
                {pharmEntries.length > 1 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">Pharmacy {i + 1}</span>
                    <button onClick={() => setPharmEntries(es => es.filter(e => e.id !== ph.id))} className="text-slate-300 hover:text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Pharmacy name" placeholder="CVS" value={ph.pharmName}
                    onChange={e => setPharmEntries(es => es.map(x => x.id === ph.id ? { ...x, pharmName: e.target.value } : x))} />
                  <Field label="Phone number" type="tel" placeholder="555-123-4567" value={ph.phone}
                    onChange={e => setPharmEntries(es => es.map(x => x.id === ph.id ? { ...x, phone: e.target.value } : x))} />
                  <Field label="Street address" placeholder="100 Main St" value={ph.pharmAddress}
                    onChange={e => setPharmEntries(es => es.map(x => x.id === ph.id ? { ...x, pharmAddress: e.target.value } : x))} />
                  <Field label="City" placeholder="New York" value={ph.pharmCity}
                    onChange={e => setPharmEntries(es => es.map(x => x.id === ph.id ? { ...x, pharmCity: e.target.value } : x))} />
                </div>
                <div className="flex gap-4 flex-wrap">
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={ph.isPrimary}
                      onChange={e => setPharmEntries(es => es.map(x => x.id === ph.id ? { ...x, isPrimary: e.target.checked } : x))}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    Primary pharmacy
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={ph.hasMailOrder}
                      onChange={e => setPharmEntries(es => es.map(x => x.id === ph.id ? { ...x, hasMailOrder: e.target.checked } : x))}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    Uses mail-order / specialty pharmacy
                  </label>
                </div>
                {allMedDevItems.length > 0 && (
                  <TagSelect label="Which medications and devices are filled here?"
                    items={allMedDevItems} selected={ph.fills}
                    onToggle={item => setPharmEntries(es => es.map(x => {
                      if (x.id !== ph.id) return x
                      return { ...x, fills: x.fills.includes(item) ? x.fills.filter(f => f !== item) : [...x.fills, item] }
                    }))} />
                )}
                {ph.hasMailOrder && (
                  <div className="ml-3 pl-3 border-l-2 border-blue-100 space-y-2 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Mail-order pharmacy name" placeholder="Express Scripts" value={ph.mailName}
                        onChange={e => setPharmEntries(es => es.map(x => x.id === ph.id ? { ...x, mailName: e.target.value } : x))} />
                      <Field label="Phone number" type="tel" placeholder="1-800-987-6543" value={ph.mailPhone}
                        onChange={e => setPharmEntries(es => es.map(x => x.id === ph.id ? { ...x, mailPhone: e.target.value } : x))} />
                    </div>
                    {allRxNames.length > 0 && (
                      <TagSelect label="Which medications via mail order?"
                        items={allRxNames} selected={ph.mailMeds}
                        onToggle={item => setPharmEntries(es => es.map(x => {
                          if (x.id !== ph.id) return x
                          return { ...x, mailMeds: x.mailMeds.includes(item) ? x.mailMeds.filter(m => m !== item) : [...x.mailMeds, item] }
                        }))} />
                    )}
                  </div>
                )}
                {i < pharmEntries.length - 1 && <div className="border-t border-slate-100 pt-1" />}
              </div>
            ))}
            <SendRow onSend={handlePharmacies} disabled={!pharmEntries.some(p => p.pharmName.trim())}
              onAdd={() => setPharmEntries(es => [...es, { id: uid(), pharmName: '', pharmAddress: '', pharmCity: '', phone: '', isPrimary: false, fills: [], hasMailOrder: false, mailName: '', mailPhone: '', mailMeds: [] }])}
              addLabel="Add another pharmacy" />
          </FormCard>
        )}

        {/* Step 10: Insurance */}
        {!typing && step === 10 && (
          <FormCard>
            {insurPlans.map((plan, i) => (
              <div key={plan.id} className="space-y-2">
                {insurPlans.length > 1 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">Plan {i + 1}</span>
                    <button onClick={() => setInsurPlans(es => es.filter(e => e.id !== plan.id))} className="text-slate-300 hover:text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Plan name" placeholder="BlueCross BlueShield" value={plan.planName}
                    onChange={e => setInsurPlans(es => es.map(x => x.id === plan.id ? { ...x, planName: e.target.value } : x))} />
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Plan type</label>
                    <select value={plan.planType} onChange={e => setInsurPlans(es => es.map(x => x.id === plan.id ? { ...x, planType: e.target.value } : x))}
                      className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {['Medical', 'Part D', 'Medicaid', 'Medicare', 'Other'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <Field label="Member ID" placeholder="XYZ123456" value={plan.memberId}
                    onChange={e => setInsurPlans(es => es.map(x => x.id === plan.id ? { ...x, memberId: e.target.value } : x))} />
                  <Field label="Group number" placeholder="GRP001" value={plan.groupNumber}
                    onChange={e => setInsurPlans(es => es.map(x => x.id === plan.id ? { ...x, groupNumber: e.target.value } : x))} />
                  <Field label="Insurance phone (member services)" type="tel" placeholder="1-800-555-0000" value={plan.phone}
                    onChange={e => setInsurPlans(es => es.map(x => x.id === plan.id ? { ...x, phone: e.target.value } : x))} />
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Coverage type</label>
                    <div className="flex gap-2">
                      {['Primary', 'Secondary'].map(ct => (
                        <button key={ct} onClick={() => setInsurPlans(es => es.map(x => x.id === plan.id ? { ...x, coverageType: ct } : x))}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium border transition
                            ${plan.coverageType === ct ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
                          {ct}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {i < insurPlans.length - 1 && <div className="border-t border-slate-100 pt-1" />}
              </div>
            ))}
            <SendRow onSend={handleInsurance}
              onAdd={() => setInsurPlans(es => [...es, { id: uid(), planName: '', planType: 'Medical', memberId: '', groupNumber: '', phone: '', coverageType: 'Primary' }])}
              addLabel="Add another plan" />
          </FormCard>
        )}

        {/* Step 11: PA yes/no/not sure */}
        {!typing && step === 11 && (
          <div className="flex gap-2 mt-1 mb-4 pl-9 flex-wrap">
            <button onClick={() => handlePaStatus('yes')} className="px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-100 transition">Yes, some do</button>
            <button onClick={() => handlePaStatus('no')} className="px-4 py-2 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition">No</button>
            <button onClick={() => handlePaStatus('not_sure')} className="px-4 py-2 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-sm font-medium hover:bg-slate-200 transition">Not sure</button>
          </div>
        )}

        {/* Step 12: Prior auth details */}
        {!typing && step === 12 && (
          <FormCard>
            {priorAuths.map((pa, i) => (
              <div key={pa.id} className="space-y-2">
                {priorAuths.length > 1 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">PA {i + 1}</span>
                    <button onClick={() => setPriorAuths(es => es.filter(e => e.id !== pa.id))} className="text-slate-300 hover:text-red-400 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Medication or device</label>
                    <div className="flex flex-wrap gap-1.5">
                      {allMedDevItems.map(item => {
                        const active = pa.item === item
                        return (
                          <button key={item} onClick={() => setPriorAuths(es => es.map(x => x.id === pa.id ? { ...x, item: active ? '' : item } : x))}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition
                              ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
                            {item}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <Field label="Expiration date (optional)" type="date" value={pa.expDate}
                    onChange={e => setPriorAuths(es => es.map(x => x.id === pa.id ? { ...x, expDate: e.target.value } : x))} />
                </div>
                {i < priorAuths.length - 1 && <div className="border-t border-slate-100 pt-1" />}
              </div>
            ))}
            <SendRow onSend={handlePriorAuths} disabled={!priorAuths.some(p => p.item.trim())}
              onAdd={() => setPriorAuths(es => [...es, { id: uid(), item: '', expDate: '' }])}
              addLabel="Add another" />
          </FormCard>
        )}

        {/* Step 13: Coverage notes */}
        {!typing && step === 13 && (
          <div className="pl-9 mt-1 mb-4">
            <div className="flex gap-2 items-start">
              <textarea autoFocus
                className="flex-1 border border-slate-200 bg-white rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                rows={3} placeholder="e.g. I have a Lilly insulin savings card, appeal in progress for CGM…"
                value={coverageNotes} onChange={e => setCoverageNotes(e.target.value)} />
              <button onClick={handleCoverageNotes}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-1 shrink-0">
                Send <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <button onClick={handleCoverageNotes} className="mt-2 text-xs text-slate-400 hover:text-slate-600 transition">Skip →</button>
          </div>
        )}

        {/* Step 14: Review & launch */}
        {!typing && step === 14 && (
          <div className="pl-9 mt-1 mb-4">
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              {[
                { label: 'Patient', items: [`${patientName} — ${condition}`, ...(submittingFor === 'someone_else' ? ['Submitted by caregiver'] : [])] },
                { label: 'Prescriptions', items: rxEntries.filter(r => r.name.trim()).map(r => [r.name, r.format && `(${r.format})`, r.refillFrequency && `· ${r.refillFrequency}`].filter(Boolean).join(' ')) },
                ...(hasDevices && deviceEntries.some(d => d.devType.trim()) ? [{ label: 'Devices', items: deviceEntries.filter(d => d.devType.trim()).map(d => [d.brand, d.devType, d.model].filter(Boolean).join(' ')) }] : []),
                ...(hasManufacturers && manufacturerEntries.some(m => m.name.trim()) ? [{ label: 'Manufacturer Support', items: manufacturerEntries.filter(m => m.name.trim()).map(m => [m.name, m.phone && `— ${m.phone}`].filter(Boolean).join(' ')) }] : []),
                { label: 'Prescribers', items: prescriberEntries.filter(p => p.name.trim()).map(p => [p.name, p.specialty && `(${p.specialty})`, p.practice && `· ${p.practice}`].filter(Boolean).join(' ')) },
                { label: 'Pharmacies', items: pharmEntries.filter(p => p.pharmName.trim()).map(p => [[p.pharmName, [p.pharmAddress, p.pharmCity].filter(Boolean).join(', ')].filter(Boolean).join(' — '), p.isPrimary && '(primary)', p.hasMailOrder && '+ mail order'].filter(Boolean).join(' ')) },
                { label: 'Insurance', items: insurPlans.filter(p => p.planName.trim()).map(p => [p.planName, `(${p.planType})`, p.memberId && `· ID: ${p.memberId}`, `· ${p.coverageType}`].filter(Boolean).join(' ')) },
                ...(paStatus === 'yes' && priorAuths.some(p => p.item.trim()) ? [{ label: 'Prior Authorizations', items: priorAuths.filter(p => p.item.trim()).map(p => [p.item, p.expDate && `(exp. ${p.expDate})`].filter(Boolean).join(' ')) }] : []),
                ...(coverageNotes.trim() ? [{ label: 'Coverage Notes', items: [coverageNotes.trim()] }] : []),
              ].map(section =>
                section.items.length > 0 ? (
                  <div key={section.label} className="px-4 py-3 border-b border-slate-100 last:border-0">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">{section.label}</p>
                    {section.items.map((item, idx) => <p key={idx} className="text-sm text-slate-800">{item}</p>)}
                  </div>
                ) : null
              )}
              <div className="px-4 py-4 bg-gradient-to-br from-blue-50 to-teal-50">
                <button onClick={handleFinish} disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-60 transition shadow-sm shadow-blue-200">
                  {saving ? 'Setting up your profile…' : 'Launch Amphelo'}
                  <Heart className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
