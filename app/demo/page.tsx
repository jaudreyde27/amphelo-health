'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Plus, ChevronRight, ChevronDown } from 'lucide-react'

interface Msg { id: string; role: 'amphelo' | 'user'; content: string }
interface PersonalInfo { fullName: string; dob: string; street: string; city: string; state: string; zip: string }
interface Rx { name: string; format: string; frequency: string; lastFilled: string }
interface Device { type: string; brand: string; model: string; hasSupply: boolean }
interface PharmacyInfo { name: string; isChain: boolean | null; address: string; phone: string }
interface InsuranceInfo { name: string; plan: string; group: string; phone: string }

const DELAY = 1100
const CONDITIONS = ['Type 1 Diabetes', 'Other']

const INPUT_CLS = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
const LABEL_CLS = 'text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1'
const PRIMARY_BTN = 'bg-blue-600 text-white rounded-xl px-6 py-2.5 text-sm font-medium hover:bg-blue-700 flex items-center gap-2'
const PRIMARY_BTN_PILL = 'bg-blue-600 text-white rounded-2xl px-5 py-2.5 text-sm font-medium hover:bg-blue-700'
const SECONDARY_BTN_PILL = 'bg-white border border-gray-300 text-gray-700 rounded-2xl px-5 py-2.5 text-sm font-medium hover:bg-gray-50'

function getDeviceServiceLine(brand: string): string {
  const b = brand.toLowerCase()
  if (b.includes('dexcom')) return '1-888-738-3646'
  if (b.includes('omnipod') || b.includes('insulet')) return '1-800-591-3455'
  if (b.includes('tandem')) return '1-877-801-6901'
  if (b.includes('medtronic')) return '1-800-646-4633'
  if (b.includes('abbott') || b.includes('freestyle') || b.includes('libre')) return '1-855-632-8658'
  return ''
}

export default function IntakePage() {
  const router = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)

  const [msgs, setMsgs] = useState<Msg[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [step, setStep] = useState(-1)

  // Personal info
  const [info, setInfo] = useState<PersonalInfo>({
    fullName: 'Audrey Chen', dob: '1992-06-14',
    street: '742 Evergreen Terrace', city: 'San Francisco', state: 'CA', zip: '94102',
  })

  // Condition
  const [conditionPhase, setConditionPhase] = useState<'yn' | 'dropdown'>('yn')
  const [selectedCondition, setSelectedCondition] = useState('Type 1 Diabetes')

  // Prescriptions
  const [rxList, setRxList] = useState<Rx[]>([
    { name: 'Humalog', format: '10mL Vial', frequency: 'Every 4 weeks', lastFilled: '2026-04-15' },
  ])

  // Devices
  const [deviceList, setDeviceList] = useState<Device[]>([
    { type: 'CGM', brand: 'Dexcom', model: 'G7', hasSupply: false },
  ])
  const [deviceServiceLine, setDeviceServiceLine] = useState('')

  // Doctors
  const [endoVal, setEndoVal] = useState('Dr. Anita Patel (Endocrinology)')
  const [pcpVal, setPcpVal] = useState('Dr. James Liu (Primary Care)')
  const [ophthoPhase, setOphthoPhase] = useState<'yn' | 'name'>('yn')
  const [ophthoVal, setOphthoVal] = useState('Dr. Sarah Kim (Ophthalmology)')

  // Pharmacy
  const [pharmacy, setPharmacy] = useState<PharmacyInfo>({
    name: 'CVS Pharmacy', isChain: true,
    address: '1420 Market St, San Francisco, CA 94102', phone: '(415) 842-7700',
  })

  // Pharmacy pickup confirmation
  const [pharmacyPickup, setPharmacyPickup] = useState<Record<string, boolean>>({})

  // Insurance
  const [primaryIns, setPrimaryIns] = useState<InsuranceInfo>({
    name: 'Blue Shield PPO', plan: 'BSC-PPO-2024-001', group: 'GRP-88412', phone: '1-800-541-6765',
  })
  const [hasSecondary, setHasSecondary] = useState(false)
  const [secondaryIns, setSecondaryIns] = useState<InsuranceInfo>({ name: '', plan: '', group: '', phone: '' })

  const addMsg = useCallback((role: 'amphelo' | 'user', content: string) => {
    setMsgs(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, role, content }])
  }, [])

  const ampheloSays = useCallback((text: string, cb?: () => void) => {
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      setMsgs(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, role: 'amphelo', content: text }])
      cb?.()
    }, DELAY)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, isTyping, step])

  useEffect(() => {
    const t = setTimeout(() => {
      ampheloSays(
        "Hi there! I'm Amphelo, your personal care coordinator. Let's get you set up — I'll start with some basic information.",
        () => setStep(0)
      )
    }, 400)
    return () => clearTimeout(t)
  }, [ampheloSays])

  const go = useCallback((userText: string, nextStep: number, nextAmphelo: string) => {
    addMsg('user', userText)
    setStep(-1)
    ampheloSays(nextAmphelo, () => setStep(nextStep))
  }, [addMsg, ampheloSays])

  // ── Handlers ────────────────────────────────────────────────────────────

  const handlePersonalInfo = () => {
    const firstName = info.fullName.split(' ')[0] || 'there'
    const summary = `${info.fullName} · DOB: ${info.dob} · ${info.street}, ${info.city}, ${info.state} ${info.zip}`
    addMsg('user', summary)
    setStep(-1)
    ampheloSays(
      `Nice to meet you, ${firstName}! Quick question — do you manage a chronic condition that requires consistent access to care or medical devices?`,
      () => setStep(1)
    )
  }

  const handleConditionYes = () => {
    setConditionPhase('dropdown')
  }

  const handleConditionSelect = () => {
    if (!selectedCondition) return
    go(
      `Yes — ${selectedCondition}`,
      2,
      `Got it. Now let's add your prescriptions — name, format (e.g. "10mL vial"), and refill frequency (e.g. "every 4 weeks").`
    )
  }

  const handleRxSubmit = () => {
    const summary = rxList
      .map(r => `${r.name} · ${r.format} · ${r.frequency} · last filled ${r.lastFilled}`)
      .join('\n')
    go(summary, 3, 'Does your care involve any medical devices? (e.g. CGM, insulin pump, infusion pump)')
  }

  const handleDeviceSubmit = () => {
    const summary = deviceList.map(d => `${d.type} · ${d.brand} · ${d.model}`).join('\n')
    const autoLine = getDeviceServiceLine(deviceList[0]?.brand || '')
    setDeviceServiceLine(autoLine)
    const brand = deviceList[0]?.brand || 'the manufacturer'
    const model = deviceList[0]?.model ? ` ${deviceList[0].model}` : ''
    addMsg('user', summary)
    setStep(-1)
    ampheloSays(
      `Got it. What's the customer service number for ${brand}${model}? I'll reach out to them directly on your behalf whenever there's an issue.`,
      () => setStep(5)
    )
  }

  const handleDeviceServiceLine = () =>
    go(deviceServiceLine, 6, "Now let's map your care team. Who is your endocrinologist or diabetes specialist?")

  const handleEndo = () =>
    go(endoVal, 7, 'And your primary care physician?')

  const handlePcp = () =>
    go(pcpVal, 8, 'T1D patients often benefit from annual eye exams. Do you have an ophthalmologist on your care team?')

  const handleOphthoYes = () => setOphthoPhase('name')

  const handleOphthoName = () =>
    go(ophthoVal, 9, 'Where do you get your prescriptions filled? Tell me about your pharmacy.')

  const handlePharmacy = () => {
    const { name, isChain, address, phone } = pharmacy
    const summary = `${name}${isChain ? ' (chain)' : ''} · ${address} · ${phone}`
    const allItems: Record<string, boolean> = {}
    rxList.forEach(rx => { allItems[rx.name] = true })
    deviceList.forEach(d => { allItems[`${d.brand} ${d.model} (${d.type})`] = true })
    setPharmacyPickup(allItems)
    addMsg('user', summary)
    setStep(-1)
    ampheloSays(
      `Got it. Which of your prescriptions and device supplies do you pick up from ${name}?`,
      () => setStep(10)
    )
  }

  const handlePharmacyPickup = () => {
    const picked = Object.entries(pharmacyPickup).filter(([, v]) => v).map(([k]) => k)
    const notPicked = Object.entries(pharmacyPickup).filter(([, v]) => !v).map(([k]) => k)
    let summary = `Picks up from ${pharmacy.name}: ${picked.join(', ')}`
    if (notPicked.length) summary += `\nNot from this pharmacy: ${notPicked.join(', ')}`
    go(
      summary,
      11,
      "Last step — insurance. Please list your primary insurance and secondary if applicable, including plan name, plan number, group number, and customer service number."
    )
  }

  const handleInsurance = () => {
    let summary = `Primary: ${primaryIns.name} · Plan #${primaryIns.plan} · Group #${primaryIns.group} · ${primaryIns.phone}`
    if (hasSecondary && secondaryIns.name) {
      summary += `\nSecondary: ${secondaryIns.name} · Plan #${secondaryIns.plan} · Group #${secondaryIns.group} · ${secondaryIns.phone}`
    }
    const firstName = info.fullName.split(' ')[0] || 'there'
    go(
      summary,
      12,
      `Perfect — your care map is complete, ${firstName}. I'll use this to proactively manage your care, handling refills, device issues, prior auths, and more before you ever have to think about them.`
    )
  }

  const updateRx = (idx: number, field: keyof Rx, val: string) =>
    setRxList(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r))

  const updateDevice = (idx: number, field: keyof Device, val: string | boolean) =>
    setDeviceList(prev => prev.map((d, i) => i === idx ? { ...d, [field]: val } : d))

  const addRx = () =>
    setRxList(prev => [...prev, { name: 'Tresiba', format: '100u/mL FlexTouch', frequency: 'Every 4 weeks', lastFilled: '2026-04-20' }])

  const addDevice = () =>
    setDeviceList(prev => [...prev, { type: 'Insulin Pump', brand: 'Omnipod', model: 'Pod 5', hasSupply: false }])

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 sticky top-0 z-10">
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <Heart className="w-4 h-4 text-white fill-white" />
        </div>
        <span className="font-semibold text-gray-900">Amphelo</span>
        <span className="text-gray-400 text-sm">/ Care Setup</span>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">

          {msgs.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'amphelo' && (
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Heart className="w-4 h-4 text-white fill-white" />
                </div>
              )}
              <div className={`max-w-sm rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Heart className="w-4 h-4 text-white fill-white" />
              </div>
              <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
                <div className="flex gap-1 items-center h-4">
                  {[0, 150, 300].map(d => (
                    <span key={d} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 0: Personal info */}
          {step === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className={LABEL_CLS}>Full Name</label>
                  <input autoFocus value={info.fullName} onChange={e => setInfo(p => ({ ...p, fullName: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handlePersonalInfo()} placeholder="Audrey Chen" className={INPUT_CLS} />
                </div>
                <div className="space-y-1">
                  <label className={LABEL_CLS}>Date of Birth</label>
                  <input type="date" value={info.dob} onChange={e => setInfo(p => ({ ...p, dob: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handlePersonalInfo()} className={INPUT_CLS} />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className={LABEL_CLS}>Street Address</label>
                  <input value={info.street} onChange={e => setInfo(p => ({ ...p, street: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handlePersonalInfo()} placeholder="742 Evergreen Terrace" className={INPUT_CLS} />
                </div>
                <div className="space-y-1">
                  <label className={LABEL_CLS}>City</label>
                  <input value={info.city} onChange={e => setInfo(p => ({ ...p, city: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handlePersonalInfo()} placeholder="San Francisco" className={INPUT_CLS} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className={LABEL_CLS}>State</label>
                    <input value={info.state} onChange={e => setInfo(p => ({ ...p, state: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handlePersonalInfo()} placeholder="CA" className={INPUT_CLS} />
                  </div>
                  <div className="space-y-1">
                    <label className={LABEL_CLS}>ZIP</label>
                    <input value={info.zip} onChange={e => setInfo(p => ({ ...p, zip: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handlePersonalInfo()} placeholder="94102" className={INPUT_CLS} />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={handlePersonalInfo} className={PRIMARY_BTN}>
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Condition yes/no → dropdown */}
          {step === 1 && conditionPhase === 'yn' && (
            <div className="flex justify-end gap-2">
              <button autoFocus onClick={handleConditionYes} className={PRIMARY_BTN_PILL}>Yes</button>
              <button className={SECONDARY_BTN_PILL}>No</button>
            </div>
          )}
          {step === 1 && conditionPhase === 'dropdown' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
              <label className={LABEL_CLS}>Select your condition</label>
              <div className="relative">
                <select
                  autoFocus
                  value={selectedCondition}
                  onChange={e => setSelectedCondition(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleConditionSelect()}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white pr-8"
                >
                  <option value="">Select condition...</option>
                  {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <div className="flex justify-end">
                <button onClick={handleConditionSelect} className={PRIMARY_BTN}>
                  Confirm <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Prescription form */}
          {step === 2 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-5">
              {rxList.map((rx, i) => (
                <div key={i} className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className={LABEL_CLS}>Medication name</label>
                    <input autoFocus={i === 0} value={rx.name} onChange={e => updateRx(i, 'name', e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleRxSubmit()} placeholder="Humalog" className={INPUT_CLS} />
                  </div>
                  <div className="space-y-1">
                    <label className={LABEL_CLS}>Format</label>
                    <input value={rx.format} onChange={e => updateRx(i, 'format', e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleRxSubmit()} placeholder="10mL vial" className={INPUT_CLS} />
                  </div>
                  <div className="space-y-1">
                    <label className={LABEL_CLS}>Refill frequency</label>
                    <input value={rx.frequency} onChange={e => updateRx(i, 'frequency', e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleRxSubmit()} placeholder="every 4 weeks" className={INPUT_CLS} />
                  </div>
                  <div className="space-y-1">
                    <label className={LABEL_CLS}>Date last picked up / received</label>
                    <input type="date" value={rx.lastFilled} onChange={e => updateRx(i, 'lastFilled', e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleRxSubmit()} className={INPUT_CLS} />
                  </div>
                </div>
              ))}
              {rxList.length < 4 && (
                <button onClick={addRx} className="text-blue-600 text-sm flex items-center gap-1 hover:text-blue-700">
                  <Plus className="w-4 h-4" /> Add another prescription
                </button>
              )}
              <div className="flex justify-end">
                <button onClick={handleRxSubmit} className={PRIMARY_BTN}>
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Medical devices yes/no */}
          {step === 3 && (
            <div className="flex justify-end gap-2">
              <button autoFocus
                onClick={() => go('Yes, I use medical devices', 4, 'Tell me about each device — type, brand, and model.')}
                className={PRIMARY_BTN_PILL}
              >
                Yes, I use medical devices
              </button>
              <button
                onClick={() => go('No, just prescriptions', 6, "Now let's map your care team. Who is your endocrinologist or diabetes specialist?")}
                className={SECONDARY_BTN_PILL}
              >
                No, just prescriptions
              </button>
            </div>
          )}

          {/* Step 4: Device form */}
          {step === 4 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-5">
              {deviceList.map((d, i) => (
                <div key={i} className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className={LABEL_CLS}>Device type</label>
                      <input autoFocus={i === 0} value={d.type} onChange={e => updateDevice(i, 'type', e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleDeviceSubmit()} placeholder="CGM" className={INPUT_CLS} />
                    </div>
                    <div className="space-y-1">
                      <label className={LABEL_CLS}>Brand</label>
                      <input value={d.brand} onChange={e => updateDevice(i, 'brand', e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleDeviceSubmit()} placeholder="Dexcom" className={INPUT_CLS} />
                    </div>
                    <div className="space-y-1">
                      <label className={LABEL_CLS}>Model</label>
                      <input value={d.model} onChange={e => updateDevice(i, 'model', e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleDeviceSubmit()} placeholder="G7" className={INPUT_CLS} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Is this a prescription supply?{' '}
                      <span className="font-normal normal-case text-gray-400">(i.e., do you get this from a pharmacy vs. direct from a manufacturer/distributor)</span>
                    </p>
                    <div className="flex gap-2">
                      {['Yes', 'No'].map(opt => (
                        <button key={opt} onClick={() => updateDevice(i, 'hasSupply', opt === 'Yes')}
                          className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                            (opt === 'Yes') === d.hasSupply
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {deviceList.length < 3 && (
                <button onClick={addDevice} className="text-blue-600 text-sm flex items-center gap-1 hover:text-blue-700">
                  <Plus className="w-4 h-4" /> Add another device
                </button>
              )}
              <div className="flex justify-end">
                <button onClick={handleDeviceSubmit} className={PRIMARY_BTN}>
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Device customer service line */}
          {step === 5 && (
            <TextConfirmInput
              value={deviceServiceLine}
              onChange={setDeviceServiceLine}
              onSubmit={handleDeviceServiceLine}
              placeholder="e.g. 1-888-738-3646"
            />
          )}

          {/* Step 6: Endo */}
          {step === 6 && (
            <TextConfirmInput value={endoVal} onChange={setEndoVal} onSubmit={handleEndo} />
          )}

          {/* Step 7: PCP */}
          {step === 7 && (
            <TextConfirmInput value={pcpVal} onChange={setPcpVal} onSubmit={handlePcp} />
          )}

          {/* Step 8: Ophthalmologist */}
          {step === 8 && ophthoPhase === 'yn' && (
            <div className="flex justify-end gap-2">
              <button autoFocus onClick={handleOphthoYes} className={PRIMARY_BTN_PILL}>Yes</button>
              <button
                onClick={() => go('No ophthalmologist', 9, 'Where do you get your prescriptions filled? Tell me about your pharmacy.')}
                className={SECONDARY_BTN_PILL}
              >
                No
              </button>
            </div>
          )}
          {step === 8 && ophthoPhase === 'name' && (
            <TextConfirmInput value={ophthoVal} onChange={setOphthoVal} onSubmit={handleOphthoName} />
          )}

          {/* Step 9: Pharmacy form card */}
          {step === 9 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className={LABEL_CLS}>Pharmacy name</label>
                  <input autoFocus value={pharmacy.name} onChange={e => setPharmacy(p => ({ ...p, name: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handlePharmacy()} placeholder="CVS Pharmacy" className={INPUT_CLS} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className={LABEL_CLS}>Is this a chain?</label>
                  <div className="flex gap-2">
                    {['Yes', 'No'].map(opt => (
                      <button key={opt} onClick={() => setPharmacy(p => ({ ...p, isChain: opt === 'Yes' }))}
                        className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                          pharmacy.isChain === (opt === 'Yes')
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="col-span-2 space-y-1">
                  <label className={LABEL_CLS}>Address</label>
                  <input value={pharmacy.address} onChange={e => setPharmacy(p => ({ ...p, address: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handlePharmacy()} placeholder="1420 Market St, San Francisco, CA 94102" className={INPUT_CLS} />
                </div>
                <div className="space-y-1">
                  <label className={LABEL_CLS}>Phone</label>
                  <input value={pharmacy.phone} onChange={e => setPharmacy(p => ({ ...p, phone: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handlePharmacy()} placeholder="(415) 842-7700" className={INPUT_CLS} />
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={handlePharmacy} className={PRIMARY_BTN}>
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 10: Pharmacy pickup confirmation */}
          {step === 10 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
              <p className="text-xs text-gray-500">Select all that apply — uncheck anything you get elsewhere.</p>
              <div className="space-y-2">
                {Object.entries(pharmacyPickup).map(([item, checked]) => (
                  <label key={item} className="flex items-center gap-3 cursor-pointer group">
                    <div
                      onClick={() => setPharmacyPickup(prev => ({ ...prev, [item]: !prev[item] }))}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 group-hover:border-blue-400'
                      }`}
                    >
                      {checked && <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <span className="text-sm text-gray-800">{item}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end">
                <button onClick={handlePharmacyPickup} className={PRIMARY_BTN}>
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 11: Insurance form */}
          {step === 11 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-5">
              {/* Primary */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Primary Insurance</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1">
                    <label className={LABEL_CLS}>Plan name</label>
                    <input autoFocus value={primaryIns.name} onChange={e => setPrimaryIns(p => ({ ...p, name: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleInsurance()} placeholder="Blue Shield PPO" className={INPUT_CLS} />
                  </div>
                  <div className="space-y-1">
                    <label className={LABEL_CLS}>Plan number</label>
                    <input value={primaryIns.plan} onChange={e => setPrimaryIns(p => ({ ...p, plan: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleInsurance()} placeholder="BSC-PPO-2024" className={INPUT_CLS} />
                  </div>
                  <div className="space-y-1">
                    <label className={LABEL_CLS}>Group number</label>
                    <input value={primaryIns.group} onChange={e => setPrimaryIns(p => ({ ...p, group: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleInsurance()} placeholder="GRP-88412" className={INPUT_CLS} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className={LABEL_CLS}>Customer service number</label>
                    <input value={primaryIns.phone} onChange={e => setPrimaryIns(p => ({ ...p, phone: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleInsurance()} placeholder="1-800-541-6765" className={INPUT_CLS} />
                  </div>
                </div>
              </div>

              {/* Secondary toggle */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Do you have secondary insurance?</p>
                <div className="flex gap-2">
                  {['Yes', 'No'].map(opt => (
                    <button key={opt} onClick={() => setHasSecondary(opt === 'Yes')}
                      className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                        hasSecondary === (opt === 'Yes')
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Secondary fields */}
              {hasSecondary && (
                <div className="space-y-3 pt-1 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Secondary Insurance</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1">
                      <label className={LABEL_CLS}>Plan name</label>
                      <input value={secondaryIns.name} onChange={e => setSecondaryIns(p => ({ ...p, name: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleInsurance()} placeholder="Medicare Part B" className={INPUT_CLS} />
                    </div>
                    <div className="space-y-1">
                      <label className={LABEL_CLS}>Plan number</label>
                      <input value={secondaryIns.plan} onChange={e => setSecondaryIns(p => ({ ...p, plan: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleInsurance()} placeholder="MED-2024-B" className={INPUT_CLS} />
                    </div>
                    <div className="space-y-1">
                      <label className={LABEL_CLS}>Group number</label>
                      <input value={secondaryIns.group} onChange={e => setSecondaryIns(p => ({ ...p, group: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleInsurance()} placeholder="GRP-00001" className={INPUT_CLS} />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className={LABEL_CLS}>Customer service number</label>
                      <input value={secondaryIns.phone} onChange={e => setSecondaryIns(p => ({ ...p, phone: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleInsurance()} placeholder="1-800-633-4227" className={INPUT_CLS} />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button onClick={handleInsurance} className={PRIMARY_BTN}>
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 12: CTA */}
          {step === 12 && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => router.push('/demo/dashboard')}
                className="bg-blue-600 text-white rounded-xl px-8 py-3 text-sm font-semibold hover:bg-blue-700 flex items-center gap-2 shadow-md"
              >
                Open My Dashboard <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  )
}

function TextConfirmInput({
  value,
  onChange,
  onSubmit,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  placeholder?: string
}) {
  return (
    <div className="flex justify-end">
      <div className="flex gap-2 w-full max-w-md">
        <input
          autoFocus
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSubmit()}
          placeholder={placeholder}
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        <button
          onClick={onSubmit}
          className="bg-blue-600 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-blue-700 flex items-center gap-1 whitespace-nowrap"
        >
          Confirm <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

