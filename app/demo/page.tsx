'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Plus, ChevronRight } from 'lucide-react'

interface Msg {
  id: string
  role: 'amphelo' | 'user'
  content: string
}

interface Rx {
  name: string
  format: string
  frequency: string
  lastFilled: string
}

interface Device {
  type: string
  brand: string
  model: string
  hasSupply: boolean
}

const DELAY = 1100

export default function IntakePage() {
  const router = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)

  const [msgs, setMsgs] = useState<Msg[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [step, setStep] = useState(-1)

  const [nameVal, setNameVal] = useState('Audrey')
  const [name, setName] = useState('')

  const [rxList, setRxList] = useState<Rx[]>([
    { name: 'Humalog', format: '10mL Vial', frequency: 'Every 4 weeks', lastFilled: '2026-04-15' },
  ])
  const [deviceList, setDeviceList] = useState<Device[]>([
    { type: 'CGM', brand: 'Dexcom', model: 'G7', hasSupply: false },
  ])

  const [endoVal, setEndoVal] = useState('Dr. Anita Patel (Endocrinology)')
  const [pcpVal, setPcpVal] = useState('Dr. James Liu (Primary Care)')
  const [pharmacyVal, setPharmacyVal] = useState('CVS Pharmacy · 1420 Market St, San Francisco, CA')
  const [insuranceVal, setInsuranceVal] = useState('Blue Shield PPO (Commercial)')

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
        "Hi there! I'm Amphelo, your personal T1D care coordinator. What's your name?",
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

  const handleName = () => {
    const n = nameVal.trim() || 'Audrey'
    setName(n)
    addMsg('user', n)
    setStep(-1)
    ampheloSays(
      `Nice to meet you, ${n}! Quick confirmation — do you have Type 1 Diabetes?`,
      () => setStep(1)
    )
  }

  const handleRxSubmit = () => {
    const summary = rxList
      .map(r => `${r.name} · ${r.format} · ${r.frequency} · last filled ${r.lastFilled}`)
      .join('\n')
    go(summary, 3, 'Got it! Does your care involve any medical devices? (e.g. CGM, insulin pump, infusion pump)')
  }

  const handleDeviceSubmit = () => {
    const summary = deviceList.map(d => `${d.type} · ${d.brand} · ${d.model}`).join('\n')
    go(summary, 5, "Now let's map your care team. Who is your endocrinologist or diabetes specialist?")
  }

  const updateRx = (idx: number, field: keyof Rx, val: string) =>
    setRxList(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r))

  const updateDevice = (idx: number, field: keyof Device, val: string | boolean) =>
    setDeviceList(prev => prev.map((d, i) => i === idx ? { ...d, [field]: val } : d))

  const addRx = () =>
    setRxList(prev => [...prev, { name: 'Tresiba', format: '100u/mL FlexTouch', frequency: 'Every 4 weeks', lastFilled: '2026-04-20' }])

  const addDevice = () =>
    setDeviceList(prev => [...prev, { type: 'Insulin Pump', brand: 'Omnipod', model: 'Pod 5', hasSupply: false }])

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
                    <span
                      key={d}
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${d}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 0: Name */}
          {step === 0 && (
            <div className="flex justify-end">
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={nameVal}
                  onChange={e => setNameVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleName()}
                  placeholder="Your name..."
                  className="border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <button onClick={handleName} className="bg-blue-600 text-white rounded-xl px-4 py-2 hover:bg-blue-700">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 1: T1D confirmation */}
          {step === 1 && (
            <div className="flex justify-end gap-2">
              <button
                onClick={() => go('Yes', 2, 'Understood. Now let\'s add your prescriptions — name, format (e.g. "10mL vial"), and refill frequency (e.g. "every 4 weeks").')}
                className="bg-blue-600 text-white rounded-2xl px-5 py-2.5 text-sm font-medium hover:bg-blue-700"
              >
                Yes
              </button>
              <button className="bg-white border border-gray-300 text-gray-700 rounded-2xl px-5 py-2.5 text-sm font-medium hover:bg-gray-50">
                No
              </button>
            </div>
          )}

          {/* Step 2: Prescription form */}
          {step === 2 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-5">
              {rxList.map((rx, i) => (
                <div key={i} className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Medication name</label>
                    <input
                      value={rx.name}
                      onChange={e => updateRx(i, 'name', e.target.value)}
                      placeholder="Humalog"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Format</label>
                    <input
                      value={rx.format}
                      onChange={e => updateRx(i, 'format', e.target.value)}
                      placeholder="10mL vial"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Refill frequency</label>
                    <input
                      value={rx.frequency}
                      onChange={e => updateRx(i, 'frequency', e.target.value)}
                      placeholder="every 4 weeks"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date last picked up / received</label>
                    <input
                      type="date"
                      value={rx.lastFilled}
                      onChange={e => updateRx(i, 'lastFilled', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
              {rxList.length < 4 && (
                <button onClick={addRx} className="text-blue-600 text-sm flex items-center gap-1 hover:text-blue-700">
                  <Plus className="w-4 h-4" /> Add another prescription
                </button>
              )}
              <div className="flex justify-end">
                <button
                  onClick={handleRxSubmit}
                  className="bg-blue-600 text-white rounded-xl px-6 py-2.5 text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Medical devices */}
          {step === 3 && (
            <div className="flex justify-end gap-2">
              <button
                onClick={() => go('Yes, I use medical devices', 4, 'Tell me about each device — type, brand, and model.')}
                className="bg-blue-600 text-white rounded-2xl px-5 py-2.5 text-sm font-medium hover:bg-blue-700"
              >
                Yes, I use medical devices
              </button>
              <button
                onClick={() => go('No, just prescriptions', 5, "Now let's map your care team. Who is your endocrinologist or diabetes specialist?")}
                className="bg-white border border-gray-300 text-gray-700 rounded-2xl px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
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
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Device type</label>
                      <input
                        value={d.type}
                        onChange={e => updateDevice(i, 'type', e.target.value)}
                        placeholder="CGM"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Brand</label>
                      <input
                        value={d.brand}
                        onChange={e => updateDevice(i, 'brand', e.target.value)}
                        placeholder="Dexcom"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Model</label>
                      <input
                        value={d.model}
                        onChange={e => updateDevice(i, 'model', e.target.value)}
                        placeholder="G7"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Also a prescription supply?{' '}
                      <span className="font-normal normal-case text-gray-400">(pump cartridges, sensors, infusion sets, etc.)</span>
                    </p>
                    <div className="flex gap-2">
                      {['Yes', 'No'].map(opt => (
                        <button
                          key={opt}
                          onClick={() => updateDevice(i, 'hasSupply', opt === 'Yes')}
                          className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                            (opt === 'Yes') === d.hasSupply
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
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
                <button
                  onClick={handleDeviceSubmit}
                  className="bg-blue-600 text-white rounded-xl px-6 py-2.5 text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Endo */}
          {step === 5 && (
            <TextConfirmInput
              value={endoVal}
              onChange={setEndoVal}
              onSubmit={() => go(endoVal, 6, 'And your primary care physician?')}
            />
          )}

          {/* Step 6: PCP */}
          {step === 6 && (
            <TextConfirmInput
              value={pcpVal}
              onChange={setPcpVal}
              onSubmit={() => go(pcpVal, 7, 'Where do you pick up your prescriptions — which pharmacy do you use?')}
            />
          )}

          {/* Step 7: Pharmacy */}
          {step === 7 && (
            <TextConfirmInput
              value={pharmacyVal}
              onChange={setPharmacyVal}
              onSubmit={() => go(pharmacyVal, 8, 'Who handles your health insurance and coverage approvals?')}
            />
          )}

          {/* Step 8: Insurance */}
          {step === 8 && (
            <TextConfirmInput
              value={insuranceVal}
              onChange={setInsuranceVal}
              onSubmit={() => go(
                insuranceVal, 9,
                "Since you use a Dexcom G7, should I add Dexcom's support line to your care network for sensor issues and warranty replacements?"
              )}
            />
          )}

          {/* Step 9: Dexcom support */}
          {step === 9 && (
            <div className="flex justify-end gap-2">
              <button
                onClick={() => go(
                  'Yes, add Dexcom',
                  10,
                  `Perfect. Here's your complete care map, ${name || 'Audrey'}. I'll use this to proactively manage your care — handling refills, device issues, prior auths, and more before you even have to think about them.`
                )}
                className="bg-blue-600 text-white rounded-2xl px-5 py-2.5 text-sm font-medium hover:bg-blue-700"
              >
                Yes, add Dexcom
              </button>
              <button
                onClick={() => go(
                  'Skip for now',
                  10,
                  `Got it. Here's your complete care map, ${name || 'Audrey'}. I'll use this to proactively manage your care.`
                )}
                className="bg-white border border-gray-300 text-gray-700 rounded-2xl px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
              >
                Skip for now
              </button>
            </div>
          )}

          {/* Step 10: Care map + CTA */}
          {step === 10 && (
            <div className="space-y-4">
              <CareMapSummary name={name || 'Audrey'} />
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => router.push('/demo/dashboard')}
                  className="bg-blue-600 text-white rounded-xl px-8 py-3 text-sm font-semibold hover:bg-blue-700 flex items-center gap-2 shadow-md"
                >
                  Open My Dashboard <ChevronRight className="w-4 h-4" />
                </button>
              </div>
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
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
}) {
  return (
    <div className="flex justify-end">
      <div className="flex gap-2 w-full max-w-md">
        <input
          autoFocus
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSubmit()}
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

function CareMapSummary({ name }: { name: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
          <Heart className="w-3 h-3 text-white fill-white" />
        </div>
        <span className="font-semibold text-gray-900 text-sm">{name} — T1D Care Map</span>
        <span className="ml-auto bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium">
          Complete
        </span>
      </div>
      <div className="bg-gray-50 rounded-xl p-4 font-mono text-xs text-gray-700 leading-6 space-y-0.5">
        <div className="font-semibold text-gray-900">{name} (T1D)</div>
        <div className="ml-2">├── Humalog 10mL Vial <span className="text-gray-400">(every 4 weeks)</span></div>
        <div className="ml-6">├── Pickup refill → <span className="text-blue-600">CVS Pharmacy</span></div>
        <div className="ml-6">└── Refill request → <span className="text-blue-600">Dr. Anita Patel</span></div>
        <div className="ml-2">├── Dexcom G7 CGM</div>
        <div className="ml-6">└── Sensor replacement → <span className="text-blue-600">Dexcom Support</span></div>
        <div className="ml-2">├── Care Team</div>
        <div className="ml-6">├── Endocrinology → <span className="text-blue-600">Dr. Anita Patel</span></div>
        <div className="ml-6">└── Primary Care → <span className="text-blue-600">Dr. James Liu</span></div>
        <div className="ml-2">└── Coverage</div>
        <div className="ml-6">└── Approvals → <span className="text-blue-600">Blue Shield PPO</span></div>
      </div>
    </div>
  )
}
