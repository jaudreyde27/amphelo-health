'use client'

import { useEffect, useRef, useState } from 'react'

type ChatStep =
  | { kind: 'ai'; text: string }
  | { kind: 'user'; text: string }
  | { kind: 'form-rx'; submittedText: string }
  | { kind: 'form-device'; submittedText: string }

const INTAKE_STEPS: ChatStep[] = [
  { kind: 'ai', text: 'Nice to meet you, Audrey! Quick confirmation — do you have Type 1 Diabetes?' },
  { kind: 'user', text: 'Yes' },
  { kind: 'ai', text: 'Understood. Now let\'s add your prescriptions — name, format (e.g. "10mL vial", "30-count pills"), and refill frequency (e.g. "every 4 weeks").' },
  { kind: 'form-rx', submittedText: 'Humalog · 10mL Vial · Every 4 weeks · last filled 2026-03-20' },
  { kind: 'ai', text: 'Got it! Does your care involve any medical devices? (e.g. CGM, insulin pump, infusion pump)' },
  { kind: 'user', text: 'Yes, I use medical devices' },
  { kind: 'ai', text: 'Tell me about each device — type, brand, and model.' },
  { kind: 'form-device', submittedText: 'CGM · Dexcom · G7' },
]

function HeartAvatar() {
  return (
    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    </div>
  )
}

// Each field is typed one at a time. fieldValues[i] is the current typed text for field i.
// activeField is which field is currently being typed. -1 = not yet started, fields.length = all done.
function RxFormCard({ fieldValues, activeField }: { fieldValues: string[]; activeField: number }) {
  const labels = ['Medication name', 'Format', 'Refill frequency', 'Date last picked up']
  const placeholders = ['Humalog', '10mL vial', 'every 4 weeks', 'mm/dd/yyyy']

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      <div className="grid grid-cols-2 gap-3">
        {labels.map((label, i) => {
          const isActive = activeField === i
          const isDone = activeField > i
          const isEmpty = !isDone && !isActive
          return (
            <div key={i}>
              <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
              <div className={`border rounded-lg px-3 py-2 text-sm min-h-[34px] flex items-center ${
                isActive ? 'border-blue-400 bg-blue-50 text-gray-900' :
                isDone   ? 'border-gray-300 bg-gray-50 text-gray-700' :
                           'border-gray-300 bg-gray-50 text-gray-400'
              }`}>
                <span>{isDone || isActive ? fieldValues[i] || '' : placeholders[i]}</span>
                {isActive && <span className="ml-0.5 animate-pulse text-blue-500">|</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DeviceFormCard({ fieldValues, activeField }: { fieldValues: string[]; activeField: number }) {
  const labels = ['Device type', 'Brand', 'Model']
  const placeholders = ['CGM', 'Dexcom', 'G7']

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      <div className="grid grid-cols-3 gap-2">
        {labels.map((label, i) => {
          const isActive = activeField === i
          const isDone = activeField > i
          return (
            <div key={i}>
              <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
              <div className={`border rounded-lg px-3 py-2 text-sm min-h-[34px] flex items-center ${
                isActive ? 'border-blue-400 bg-blue-50 text-gray-900' :
                isDone   ? 'border-gray-300 bg-gray-50 text-gray-700' :
                           'border-gray-300 bg-gray-50 text-gray-400'
              }`}>
                <span>{isDone || isActive ? fieldValues[i] || '' : placeholders[i]}</span>
                {isActive && <span className="ml-0.5 animate-pulse text-blue-500">|</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Per-form typing state: fieldValues[fieldIndex] = typed chars so far, activeField = which field is active, submitted = done typing all fields
interface FormState {
  fieldValues: string[]
  activeField: number // -1 = not started, 0..n = typing field i, n+1 = all done (show bubble)
  submittedText: string
}

function typeFieldByField(
  fields: string[],
  charDelay: number,
  pauseBetween: number,
  onUpdate: (fieldValues: string[], activeField: number) => void,
  onDone: () => void
): () => void {
  let cancelled = false
  let timeouts: ReturnType<typeof setTimeout>[] = []

  const schedule = (fn: () => void, delay: number) => {
    const t = setTimeout(() => { if (!cancelled) fn() }, delay)
    timeouts.push(t)
  }

  let cursor = 0
  fields.forEach((fieldText, fieldIdx) => {
    const fieldStart = cursor
    // Show active field at start (empty)
    schedule(() => onUpdate(Array(fields.length).fill('').map((_, i) => i < fieldIdx ? fields[i] : ''), fieldIdx), fieldStart)
    cursor += 80 // small pause before typing starts

    // Type each char
    for (let c = 1; c <= fieldText.length; c++) {
      const charSnapshot = c
      schedule(() => {
        onUpdate(
          Array(fields.length).fill('').map((_, i) => i < fieldIdx ? fields[i] : i === fieldIdx ? fieldText.slice(0, charSnapshot) : ''),
          fieldIdx
        )
      }, cursor)
      cursor += charDelay
    }
    cursor += pauseBetween
  })

  // All done — activeField = fields.length signals "submitted"
  schedule(() => {
    onUpdate(fields.map(f => f), fields.length)
    onDone()
  }, cursor)

  return () => {
    cancelled = true
    timeouts.forEach(clearTimeout)
  }
}

// Animation 1: Intake Chat Animation — mirrors the real intake screenshots
export function IntakeAnimation() {
  const [visibleCount, setVisibleCount] = useState(0)
  const [rxForm, setRxForm] = useState<FormState>({ fieldValues: [], activeField: -1, submittedText: '' })
  const [deviceForm, setDeviceForm] = useState<FormState>({ fieldValues: [], activeField: -1, submittedText: '' })
  const containerRef = useRef<HTMLDivElement>(null)

  const scroll = () => {
    setTimeout(() => {
      if (containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight
    }, 50)
  }

  useEffect(() => {
    const cleanups: (() => void)[] = []

    const run = async () => {
      setVisibleCount(0)
      setRxForm({ fieldValues: [], activeField: -1, submittedText: '' })
      setDeviceForm({ fieldValues: [], activeField: -1, submittedText: '' })

      // Show each chat step with a delay
      const stepDelays = [400, 1400, 2400, 3400, 3400, 3400, 3400, 3400]
      // Steps 0-2 are chat messages. Step 3 is form-rx. Step 4 is chat. Steps 5-6 are chat. Step 7 is form-device.
      const chatStepDelays = [400, 1400, 2400]
      const rxFormDelay = 3600
      const afterRxDelay = 3600 + 4200 // chat continues after rx form typing done
      const deviceFormDelay = afterRxDelay + 2400

      // Show first 3 chat messages
      chatStepDelays.forEach((delay, i) => {
        const t = setTimeout(() => { setVisibleCount(i + 1); scroll() }, delay)
        cleanups.push(() => clearTimeout(t))
      })

      // Show rx form card
      const t1 = setTimeout(() => { setVisibleCount(4); scroll() }, rxFormDelay)
      cleanups.push(() => clearTimeout(t1))

      // Start typing into rx form fields
      const t2 = setTimeout(() => {
        const rxFields = ['Humalog', '10mL Vial', 'Every 4 weeks', '2026-03-20']
        const stop = typeFieldByField(
          rxFields,
          60,
          300,
          (fieldValues, activeField) => { setRxForm(prev => ({ ...prev, fieldValues, activeField })); scroll() },
          () => { setRxForm({ fieldValues: rxFields, activeField: rxFields.length, submittedText: rxFields.join(' · ') }); scroll() }
        )
        cleanups.push(stop)
      }, rxFormDelay + 200)
      cleanups.push(() => clearTimeout(t2))

      // Show next 3 chat messages after rx typing done
      ;[0, 1200, 2400].forEach((extra, i) => {
        const t = setTimeout(() => { setVisibleCount(5 + i); scroll() }, afterRxDelay + extra)
        cleanups.push(() => clearTimeout(t))
      })

      // Show device form card
      const t3 = setTimeout(() => { setVisibleCount(8); scroll() }, deviceFormDelay)
      cleanups.push(() => clearTimeout(t3))

      // Start typing into device form fields
      const t4 = setTimeout(() => {
        const deviceFields = ['CGM', 'Dexcom', 'G7']
        const stop = typeFieldByField(
          deviceFields,
          80,
          300,
          (fieldValues, activeField) => { setDeviceForm(prev => ({ ...prev, fieldValues, activeField })); scroll() },
          () => { setDeviceForm({ fieldValues: deviceFields, activeField: deviceFields.length, submittedText: 'CGM · Dexcom · G7' }); scroll() }
        )
        cleanups.push(stop)
      }, deviceFormDelay + 200)
      cleanups.push(() => clearTimeout(t4))
    }

    run()
    const totalDuration = 3600 + 4200 + 2400 + 2400 + 3000
    const interval = setInterval(run, totalDuration)
    cleanups.push(() => clearInterval(interval))

    return () => cleanups.forEach(fn => fn())
  }, [])

  const rxSubmitted = rxForm.activeField === 4
  const deviceSubmitted = deviceForm.activeField === 3

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-3 p-5 bg-[#f0f2f8] rounded-2xl border border-gray-200 h-80 overflow-y-auto"
    >
      {INTAKE_STEPS.slice(0, visibleCount).map((step, idx) => {
        if (step.kind === 'ai') {
          return (
            <div key={idx} className="flex items-start gap-2">
              <HeartAvatar />
              <div className="bg-white text-gray-900 text-sm px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm max-w-xs leading-snug">
                {step.text}
              </div>
            </div>
          )
        }
        if (step.kind === 'user') {
          return (
            <div key={idx} className="flex justify-end">
              <div className="bg-blue-600 text-white text-sm px-4 py-3 rounded-2xl rounded-tr-sm shadow-md max-w-xs leading-snug">
                {step.text}
              </div>
            </div>
          )
        }
        if (step.kind === 'form-rx') {
          return (
            <div key={idx} className="flex flex-col gap-2">
              {!rxSubmitted && (
                <RxFormCard fieldValues={rxForm.fieldValues} activeField={rxForm.activeField} />
              )}
              {rxSubmitted && (
                <div className="flex justify-end">
                  <div className="bg-blue-600 text-white text-sm px-4 py-3 rounded-2xl rounded-tr-sm shadow-md max-w-xs leading-snug">
                    {rxForm.submittedText}
                  </div>
                </div>
              )}
            </div>
          )
        }
        if (step.kind === 'form-device') {
          return (
            <div key={idx} className="flex flex-col gap-2">
              {!deviceSubmitted && (
                <DeviceFormCard fieldValues={deviceForm.fieldValues} activeField={deviceForm.activeField} />
              )}
              {deviceSubmitted && (
                <div className="flex justify-end">
                  <div className="bg-blue-600 text-white text-sm px-4 py-3 rounded-2xl rounded-tr-sm shadow-md max-w-xs leading-snug">
                    {deviceForm.submittedText}
                  </div>
                </div>
              )}
            </div>
          )
        }
        return null
      })}
    </div>
  )
}

// Animation 2: EXACT AdHocRequestsAnimation from published website
export function ChatAnimation() {
  const [visibleMessages, setVisibleMessages] = useState<number[]>([])
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const messages = [
    { type: 'user', text: "I'm traveling to Atlanta, Georgia and I left my Humalog pen at home. I need a replacement. My zipcode is 30309." },
    { type: 'assistant', text: "I'm on it. Your closest Walgreens is at 1180 Peachtree St NE, Atlanta, GA 30309. Hours are 8:00 AM – 10:00 PM." },
    { type: 'assistant', text: "I'm calling them now to see whether they have your insulin in stock and whether we can get you a vacation override." },
    { type: 'status', text: 'Initiating call to Walgreens...', status: 'initiating' },
    { type: 'status', text: 'Call in progress', status: 'progress' },
    { type: 'assistant', text: 'Call completed. Walgreens confirmed they can process a vacation override. Your Humalog refill is now processing and will be ready for pickup in approximately 30 minutes.' },
    { type: 'status', text: 'Vacation override approved', status: 'success' },
  ]

  useEffect(() => {
    const showMessages = async () => {
      for (let i = 0; i < messages.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1200))
        setVisibleMessages(prev => [...prev, i])
      }
      await new Promise(resolve => setTimeout(resolve, 2000))
      setVisibleMessages([])
    }

    const interval = setInterval(() => {
      showMessages()
    }, (messages.length * 1200) + 2000)

    showMessages()
    return () => clearInterval(interval)
  }, [messages.length])

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el || visibleMessages.length === 0) return
    // Only scroll down if content overflows the container
    if (el.scrollHeight > el.clientHeight) {
      el.scrollTo({ top: el.scrollHeight - el.clientHeight, behavior: 'smooth' })
    }
  }, [visibleMessages])

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col" style={{ height: '420px' }}>

      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 14s1 1.5 3.5 1.5 3.5-1.5 3.5-1.5" />
              <circle cx="9" cy="10" r="0.8" fill="currentColor" stroke="none" />
              <circle cx="15" cy="10" r="0.8" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-none">Amphelo Care Coordinator</p>
          <p className="text-xs text-emerald-500 mt-0.5">Online · Ready to help</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.filter((_, index) => visibleMessages.includes(index)).map((message, _, arr) => {
          const index = messages.indexOf(message)
          return (
          <div
            key={index}
            className="transform transition-all duration-500 opacity-100 translate-y-0 animate-fadeSlideIn"
          >
            {message.type === 'user' ? (
              <div className="flex justify-end">
                <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-sky-500 text-white text-sm px-4 py-2.5 shadow-sm">
                  {message.text}
                </div>
              </div>
            ) : message.type === 'status' ? (
              <div className="flex justify-center">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                  message.status === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : message.status === 'progress'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-sky-50 text-sky-700 border border-sky-200'
                }`}>
                  {message.status === 'success' ? (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  )}
                  {message.text}
                </div>
              </div>
            ) : (
              <div className="flex justify-start gap-2">
                <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="9" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 14s1 1.5 3.5 1.5 3.5-1.5 3.5-1.5" />
                    <circle cx="9" cy="10" r="0.8" fill="currentColor" stroke="none" />
                    <circle cx="15" cy="10" r="0.8" fill="currentColor" stroke="none" />
                  </svg>
                </div>
                <div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-gray-100 text-gray-900 text-sm px-4 py-2.5 shadow-sm">
                  {message.text}
                </div>
              </div>
            )}
          </div>
          )
        })}
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 border-t border-gray-100 px-3 py-2.5 bg-white">
        <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
          <input
            type="text"
            disabled
            placeholder="Message Amphelo Care Coordinator..."
            className="flex-1 bg-transparent text-sm text-gray-400 placeholder-gray-400 outline-none cursor-default"
          />
          <button disabled className="w-7 h-7 rounded-full bg-sky-500 flex items-center justify-center flex-shrink-0 opacity-40">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>

    </div>
  )
}

// Animation 3: Dashboard Animation — 4-part tabbed animation
const PLUS_TABS = [
  { label: 'Your Care Map' },
  { label: 'Prescriptions & Device Status Managed' },
  { label: 'Appointment Management' },
  { label: 'And more features' },
]

const PLUS_TAB_DURATION = 4500 // ms each tab is shown

// Part 1: Care Map
function CareMapPanel() {
  return (
    <div className="overflow-y-auto max-h-72 p-4">
      <p className="text-xs text-gray-400 mb-3">Your full care network at a glance</p>
      <div className="grid grid-cols-2 gap-2">
        {/* Prescribers */}
        <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              <span className="text-xs font-bold text-indigo-700 tracking-wide">PRESCRIBERS</span>
            </div>
            <span className="text-xs text-indigo-400">2</span>
          </div>
          <div className="space-y-1.5">
            <div><p className="text-xs font-semibold text-gray-800 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />Dr. Anita Patel</p><p className="text-xs text-gray-400 pl-2.5">Endocrinology · UCSF</p></div>
            <div><p className="text-xs font-semibold text-gray-800 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />Dr. James Liu</p><p className="text-xs text-gray-400 pl-2.5">Primary Care · One Medical</p></div>
          </div>
        </div>
        {/* Medications */}
        <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              <span className="text-xs font-bold text-indigo-700 tracking-wide">MEDICATIONS</span>
            </div>
            <span className="text-xs text-indigo-400">4</span>
          </div>
          <div className="space-y-1">
            {['Humalog KwikPen', 'Tresiba FlexTouch', 'Dexcom G7 Sensor', 'Omnipod 5 Pods'].map(m => (
              <p key={m} className="text-xs text-gray-700 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-300 flex-shrink-0" />{m}</p>
            ))}
          </div>
        </div>
        {/* Devices */}
        <div className="rounded-xl bg-teal-50 border border-teal-100 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="4" y="4" width="16" height="16" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 9h6M9 12h6M9 15h4" /></svg>
              <span className="text-xs font-bold text-teal-700 tracking-wide">DEVICES</span>
            </div>
            <span className="text-xs text-teal-400">2</span>
          </div>
          <div className="space-y-1.5">
            <div><p className="text-xs font-semibold text-gray-800 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />Dexcom G7 CGM</p><p className="text-xs text-gray-400 pl-2.5">Refill every 10 days</p></div>
            <div><p className="text-xs font-semibold text-gray-800 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />Omnipod 5 Pump Pod</p><p className="text-xs text-gray-400 pl-2.5">Refill monthly</p></div>
          </div>
        </div>
        {/* Pharmacies */}
        <div className="rounded-xl bg-teal-50 border border-teal-100 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              <span className="text-xs font-bold text-teal-700 tracking-wide">PHARMACIES</span>
            </div>
            <span className="text-xs text-teal-400">2</span>
          </div>
          <div className="space-y-1.5">
            <div><p className="text-xs font-semibold text-gray-800 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />CVS Pharmacy</p><p className="text-xs text-gray-400 pl-2.5">1420 Market St, SF</p></div>
            <div><p className="text-xs font-semibold text-gray-800 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />Walgreens</p><p className="text-xs text-gray-400 pl-2.5">498 Castro St, SF</p></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Part 2: Prescriptions & Device Status (existing animation logic, self-contained)
const prescriptions = [
  {
    name: 'Humalog',
    detail: '100u/mL KwikPen',
    status: 'Refill Ready for Pickup',
    statusType: 'ready',
    lastAction: 'Mar 14, 2026',
    refills: '3 refills remaining',
    pharmacy: 'CVS Pharmacy · 1420 Market St, San Francisco, CA 94102',
    confirmation: 'Confirmed: Humalog 100u/mL KwikPen (Rx #4421089) is ready for pickup at CVS Pharmacy.',
  },
  {
    name: 'Tresiba',
    detail: '100u/mL FlexTouch',
    status: 'Refill to be confirmed',
    statusType: 'pending',
    nextRefill: 'Mar 17, 2026',
    confirmDate: 'Mar 14, 2026',
    refills: '2 refills remaining',
    pharmacy: 'CVS Pharmacy · 1420 Market St, San Francisco, CA 94102',
  },
  {
    name: 'Dexcom G7 Sensor',
    detail: '10-pack',
    status: 'Refill Ready for Pickup',
    statusType: 'ready',
    lastAction: 'Mar 13, 2026',
    refills: '5 refills remaining',
    pharmacy: 'Walgreens · 498 Castro St, San Francisco, CA 94114',
    confirmation: 'Confirmed: Dexcom G7 Sensor 10-pack (Rx #8813047) is ready for pickup at Walgreens.',
  },
]

function PrescriptionsPanel({ active }: { active: boolean }) {
  const [visibleCards, setVisibleCards] = useState<number[]>([])

  useEffect(() => {
    if (!active) { setVisibleCards([]); return }
    let cancelled = false
    const run = async () => {
      setVisibleCards([])
      for (let i = 0; i < prescriptions.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 600))
        if (cancelled) return
        setVisibleCards(prev => [...prev, i])
      }
    }
    run()
    return () => { cancelled = true }
  }, [active])

  return (
    <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
      {prescriptions.map((rx, idx) => (
        <div key={idx} className={`px-5 py-4 transition-all duration-500 ${visibleCards.includes(idx) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${rx.statusType === 'ready' ? 'bg-teal-50 border border-teal-200' : 'bg-blue-50 border border-blue-200'}`}>
              {rx.statusType === 'ready' ? (
                <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" /></svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="text-sm font-bold text-gray-900">{rx.name}</span>
                <span className="text-xs text-gray-400">{rx.detail}</span>
              </div>
              <p className={`text-xs font-semibold mb-1 ${rx.statusType === 'ready' ? 'text-teal-600' : 'text-blue-600'}`}>{rx.status}</p>
              {rx.lastAction && <p className="text-xs text-gray-500 mb-0.5"><span className="font-medium text-gray-700">Last action:</span> {rx.lastAction}</p>}
              {rx.nextRefill && <p className="text-xs text-gray-500 mb-0.5"><span className="font-medium text-gray-700">Next Refill:</span> {rx.nextRefill}</p>}
              {rx.confirmDate && <p className="text-xs text-gray-500 mb-0.5"><span className="font-medium text-gray-700">Amphelo to confirm:</span> {rx.confirmDate}</p>}
              <p className="text-xs text-gray-400 mb-0.5">{rx.refills}</p>
              <p className="text-xs text-gray-400 truncate">{rx.pharmacy}</p>
              {rx.confirmation && <div className="mt-2 px-3 py-2 bg-teal-50 border border-teal-100 rounded text-xs text-teal-800 leading-relaxed">{rx.confirmation}</div>}
              {rx.statusType === 'pending' && (
                <button className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 bg-white">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Run now
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Part 3: Appointments
function AppointmentsPanel() {
  return (
    <div className="max-h-72 overflow-y-auto p-4">
      <div className="space-y-3">
        {/* Confirmed appt */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900">Endocrinology: Next appt in 3 months</p>
              <p className="text-xs text-gray-400">Quarterly check-in with Dr. Anita Patel — UCSF Diabetes Center</p>
              <p className="text-xs text-gray-400 mt-0.5">Last action: Mar 9, 2026</p>
              <div className="mt-2 px-3 py-2 bg-teal-50 border border-teal-100 rounded text-xs text-teal-800 leading-relaxed">
                Confirmed: Next appointment with Dr. Anita Patel on Tuesday, June 9 at 3:30pm. UCSF Diabetes Center.
              </div>
            </div>
          </div>
        </div>
        {/* Pending appt */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" /></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900">Ophthalmology: Annual eye exam due in 10 months</p>
              <p className="text-xs text-gray-400">Annual diabetic eye exam — no appointment booked yet</p>
              <p className="text-xs text-gray-400 mt-0.5">Scheduled: May 9, 2026</p>
              <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded text-xs text-amber-800 leading-relaxed">
                No appointment booked. To schedule, launch an Ad Hoc Request.
              </div>
              <button className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 bg-white">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Run now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Part 4: And more features
function MoreFeaturesPanel() {
  const features = [
    { title: 'Insurance Tracking', desc: 'Member ID, plan type, and coverage status at a glance.' },
    { title: 'Manufacturer Support', desc: 'Direct lines to Dexcom, Insulet, and more — always ready.' },
    { title: 'Proactive Alerts', desc: 'Get notified before refills run out or authorizations expire.' },
    { title: 'Full Care History', desc: 'Every action Amphelo has taken, logged and searchable.' },
  ]
  return (
    <div className="p-5">
      <p className="text-xs text-gray-400 mb-4">More tools built into your Amphelo Plus dashboard.</p>
      <div className="grid grid-cols-2 gap-3">
        {features.map(f => (
          <div key={f.title} className="rounded-xl bg-gray-50 border border-gray-100 p-3">
            <p className="text-xs font-bold text-gray-900 mb-1">{f.title}</p>
            <p className="text-xs text-gray-500 leading-snug">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

const PLUS_PANELS = [
  {
    label: 'Your Care Map',
    icon: <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>,
  },
  {
    label: 'Prescriptions & Device Status Managed',
    icon: <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
  },
  {
    label: 'Appointment Management',
    icon: <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" /></svg>,
  },
  {
    label: 'And more features',
    icon: <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  },
]

export function DashboardAnimation() {
  const [active, setActive] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setActive(prev => (prev + 1) % PLUS_PANELS.length)
        setVisible(true)
      }, 350)
    }, 4500)
    return () => clearInterval(interval)
  }, [])

  const panel = PLUS_PANELS[active]

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden w-full">
      {/* Single header — changes with each panel */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50 transition-all duration-300"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(-4px)' }}
      >
        <div className="flex items-center gap-2">
          {panel.icon}
          <span className="text-sm font-semibold text-gray-900">{panel.label}</span>
        </div>
      </div>

      {/* Panel content */}
      <div
        className="transition-all duration-300"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(6px)' }}
      >
        {active === 0 && <CareMapPanel />}
        {active === 1 && <PrescriptionsPanel active={visible && active === 1} />}
        {active === 2 && <AppointmentsPanel />}
        {active === 3 && <MoreFeaturesPanel />}
      </div>
    </div>
  )
}

// Animation 4: Phone Call Animation — showing someone calling a pharmacy with happy people
const outreachTasks = [
  { type: 'scheduled', label: 'Humalog refill', target: 'CVS Pharmacy', method: 'Tech', status: 'complete', time: '6:02 AM' },
  { type: 'scheduled', label: 'Dexcom G7 sensor refill', target: 'Walgreens', method: 'Tech', status: 'complete', time: '6:03 AM' },
  { type: 'adhoc', label: 'Vacation override request', target: 'CVS Pharmacy', method: 'Call', status: 'complete', time: '9:14 AM' },
  { type: 'scheduled', label: 'Prior auth renewal', target: 'Dr. Anita Patel', method: 'Tech', status: 'active', time: 'Now' },
  { type: 'adhoc', label: 'Bridge prescription request', target: 'Dr. James Liu', method: 'Call', status: 'queued', time: 'On request' },
]

export function OutreachAnimation() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-semibold text-gray-900">Amphelo Workflows</span>
        </div>
        <span className="text-xs text-gray-400">5 tasks</span>
      </div>

      {/* Task list — static end state */}
      <div className="divide-y divide-gray-100">
        {outreachTasks.map((task, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3">
            {/* Method icon */}
            <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center border ${
              task.method === 'Call' ? 'bg-sky-50 border-sky-200' : 'bg-indigo-50 border-indigo-200'
            }`}>
              {task.method === 'Call' ? (
                <svg className="w-4 h-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
            </div>

            {/* Task info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-semibold text-gray-900 truncate">{task.label}</span>
                <span className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  task.type === 'adhoc'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {task.type === 'adhoc' ? 'Ad hoc' : 'Scheduled'}
                </span>
              </div>
              <p className="text-xs text-gray-400 truncate">{task.target} &middot; {task.method === 'Call' ? 'Voice call' : 'Tech integration'}</p>
            </div>

            {/* Status */}
            <div className="flex-shrink-0 flex flex-col items-end gap-1">
              <span className={`text-xs font-semibold ${
                task.status === 'complete' ? 'text-emerald-600' :
                task.status === 'active' ? 'text-sky-600' :
                'text-gray-400'
              }`}>
                {task.status === 'complete' ? '✓ Done' : task.status === 'active' ? 'Active' : 'Queued'}
              </span>
              <span className="text-xs text-gray-300">{task.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PhoneCallAnimation() {
  const [callActive, setCallActive] = useState(false)
  const [showHappiness, setShowHappiness] = useState(false)

  useEffect(() => {
    const loop = () => {
      setCallActive(false)
      setShowHappiness(false)
      
      // Start call
      setTimeout(() => setCallActive(true), 400)
      
      // Show happiness/success
      setTimeout(() => setShowHappiness(true), 2400)
      
      // Reset for loop
      setTimeout(() => {
        setCallActive(false)
        setShowHappiness(false)
      }, 4800)
    }

    loop()
    const interval = setInterval(loop, 5200)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden w-full p-8 h-80 flex flex-col items-center justify-center gap-6">
      {/* Figures row */}
      <div className="flex items-center justify-center w-full gap-4">
        {/* Amphelo Staff */}
        <div className="flex flex-col items-center gap-2 w-20">
          <div className={`w-16 h-16 rounded-full overflow-hidden border-2 transition-all duration-500 ${callActive ? 'border-blue-400 scale-110' : 'border-gray-200 scale-100'}`}>
            <img src="/images/amphelo-staff.jpg" alt="Amphelo Staff" className="w-full h-full object-cover" />
          </div>
          <div className="text-xs font-medium text-gray-700 text-center">Amphelo Staff</div>
        </div>

        {/* Connection line */}
        <div className="flex flex-col items-center flex-1 gap-2">
          <div className={`w-full h-1 rounded-full transition-all duration-500 ${callActive ? 'bg-blue-400' : 'bg-gray-200'}`} />
          <div className="text-xs font-semibold h-4">
            {callActive && !showHappiness && <span className="text-blue-600">Calling...</span>}
            {showHappiness && <span className="text-green-600">Resolved!</span>}
          </div>
        </div>

        {/* Pharmacy */}
        <div className="flex flex-col items-center gap-2 w-20">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${showHappiness ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
            <span className="text-3xl">{showHappiness ? '😊' : '👤'}</span>
          </div>
          <div className="text-xs font-medium text-gray-700 text-center">Pharmacy</div>
        </div>
      </div>

      {/* Bottom status */}
      <div className="text-center h-5">
        {!callActive && !showHappiness && (
          <p className="text-sm text-gray-400">Ready to step in</p>
        )}
      </div>
    </div>
  )
}
