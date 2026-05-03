'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, User, Pill, Monitor, Building2, Shield, Phone, Send, CheckCircle2, AlertCircle, Calendar } from 'lucide-react'

type Tab = 'dashboard' | 'requests'

// ── Demo data ──────────────────────────────────────────────────────────────

const CARE_NETWORK = {
  prescribers: [
    { name: 'Dr. Anita Patel', detail: 'Endocrinology' },
    { name: 'Dr. James Liu', detail: 'Primary Care' },
    { name: 'Dr. Sarah Kim', detail: 'Ophthalmology' },
  ],
  medications: [
    'Humalog 100u/mL KwikPen',
    'Tresiba 100u/mL FlexTouch',
  ],
  devices: ['Dexcom CGM Sensor G7', 'Omnipod Insulin Pump Pod 5'],
  pharmacies: [
    { name: 'CVS Pharmacy', address: '1420 Market St, San Francisco, CA 94102', phone: '(415) 842-7700' },
    { name: 'Walgreens', address: '498 Castro St, San Francisco, CA 94114', phone: '(415) 931-4450' },
  ],
  insurance: ['Blue Shield PPO (Commercial) — Medical + Pharmacy'],
  manufacturerSupport: [
    { name: 'Dexcom Support', phone: '1-888-738-3646' },
    { name: 'Insulet (Omnipod)', phone: '1-800-591-3455' },
  ],
}

const PRESCRIPTIONS = [
  { name: 'Humalog KwikPen', format: '100u/mL', nextRefill: 'May 13, 2026', daysAway: 10, status: 'due-soon' as const, agentNote: 'Refill request queued' },
  { name: 'Tresiba FlexTouch', format: '100u/mL', nextRefill: 'May 18, 2026', daysAway: 15, status: 'on-track' as const, agentNote: null },
  { name: 'Dexcom G7 Sensors', format: '10-pack', nextRefill: 'Jun 30, 2026', daysAway: 58, status: 'on-track' as const, agentNote: null },
  { name: 'Omnipod 5 Pods', format: '10-pack', nextRefill: 'May 10, 2026', daysAway: 7, status: 'due-soon' as const, agentNote: 'Refill request queued' },
]

const DEVICES = [
  { name: 'Dexcom G7', type: 'CGM', status: 'active' as const, note: 'No active issues' },
  { name: 'Omnipod Pod 5', type: 'Insulin Pump', status: 'active' as const, note: 'No active issues' },
]

const APPOINTMENTS = [
  { doctor: 'Dr. Anita Patel', specialty: 'Endocrinology', date: 'May 20, 2026', time: '10:00 AM', daysAway: 17, status: 'confirmed' as const, lastVisit: null },
  { doctor: 'Dr. James Liu', specialty: 'Primary Care', date: 'Jun 10, 2026', time: '2:30 PM', daysAway: 38, status: 'confirmed' as const, lastVisit: null },
  { doctor: 'Dr. Sarah Kim', specialty: 'Ophthalmology', date: null, time: null, daysAway: null, status: 'unscheduled' as const, lastVisit: 'Jan 15, 2026' },
]

const RECENT_REQUESTS = [
  { id: 1, summary: 'CGM sensor failed mid-day', date: 'Apr 30', status: 'resolved' as const, outcome: 'Dexcom contacted — replacement shipped' },
  { id: 2, summary: 'Humalog prior authorization needed', date: 'Apr 22', status: 'in-progress' as const, outcome: 'Prior auth submitted to Blue Shield' },
  { id: 3, summary: 'Reschedule endocrinology appointment', date: 'Apr 15', status: 'resolved' as const, outcome: 'Appointment moved to May 20' },
]

// ── Pre-loaded chat (Atlanta scenario already resolved) ────────────────────

type ReqMsg = {
  id: string
  type: 'user' | 'amphelo' | 'pill-blue' | 'pill-amber' | 'pill-green'
  content: string
}

const PRELOADED_CHAT: ReqMsg[] = [
  { id: 'p1', type: 'user', content: "I'm traveling to Atlanta, Georgia and I left my Humalog pen at home. I need a replacement. My zipcode is 30309." },
  { id: 'p2', type: 'amphelo', content: "I'm on it. Your closest Walgreens is at **1180 Peachtree St NE, Atlanta, GA 30309**. Hours are 8:00 AM – 10:00 PM." },
  { id: 'p3', type: 'amphelo', content: "I'm calling them now to see whether they have your insulin in stock and whether we can get you a vacation override." },
  { id: 'p4', type: 'pill-blue', content: 'Initiating call to Walgreens...' },
  { id: 'p5', type: 'pill-amber', content: 'Call in progress' },
  { id: 'p6', type: 'amphelo', content: 'Call completed. Walgreens confirmed they can process a vacation override. Your Humalog refill is now processing and will be ready for pickup in approximately 30 minutes.' },
  { id: 'p7', type: 'pill-green', content: 'Vacation override approved' },
]

// ── Scenarios for new requests ─────────────────────────────────────────────

function getScenario(text: string): ReqMsg[] {
  const t = text.toLowerCase()
  const id = () => `${Date.now()}-${Math.random()}`

  if (t.includes('sensor') || t.includes('cgm') || t.includes('dexcom') || t.includes('g7')) {
    return [
      { id: id(), type: 'amphelo', content: "I'm on it. I'm contacting Dexcom now to process a warranty replacement for your G7 sensor." },
      { id: id(), type: 'pill-blue', content: 'Initiating contact with Dexcom...' },
      { id: id(), type: 'pill-amber', content: 'Connecting to Dexcom warranty line...' },
      { id: id(), type: 'amphelo', content: 'Replacement confirmed. Your new G7 sensor will ship within 24 hours. Tracking info will be sent to your email on file.' },
      { id: id(), type: 'pill-green', content: 'Replacement order confirmed' },
    ]
  }

  if (t.includes('insulin') || t.includes('humalog') || t.includes('tresiba') || t.includes('refill') || t.includes('pharmacy')) {
    return [
      { id: id(), type: 'amphelo', content: "I'm on it. Let me check Humalog stock at your nearest in-network pharmacy." },
      { id: id(), type: 'pill-blue', content: 'Checking pharmacy stock...' },
      { id: id(), type: 'pill-amber', content: 'Calling CVS Pharmacy...' },
      { id: id(), type: 'amphelo', content: 'CVS confirmed Humalog is in stock. Your refill has been processed and will be ready for pickup in approximately 2 hours.' },
      { id: id(), type: 'pill-green', content: 'Refill order confirmed' },
    ]
  }

  if (t.includes('appointment') || t.includes('doctor') || t.includes('reschedule') || t.includes('patel') || t.includes('liu')) {
    return [
      { id: id(), type: 'amphelo', content: "I'll reach out to Dr. Patel's office to check available slots and handle the scheduling for you." },
      { id: id(), type: 'pill-blue', content: "Contacting Dr. Patel's office..." },
      { id: id(), type: 'pill-amber', content: 'Scheduling request in progress...' },
      { id: id(), type: 'amphelo', content: "Done. Dr. Patel's office confirmed an opening. Your appointment is set — you'll receive a confirmation by email shortly." },
      { id: id(), type: 'pill-green', content: 'Appointment confirmed' },
    ]
  }

  return [
    { id: id(), type: 'amphelo', content: "I'm reviewing your care profile and coordinating with the right contacts in your network." },
    { id: id(), type: 'pill-blue', content: 'Analyzing request...' },
    { id: id(), type: 'pill-amber', content: 'Coordinating with care network...' },
    { id: id(), type: 'amphelo', content: "Done. I've reached out to the relevant contacts in your care network. I'll update you as soon as I hear back." },
    { id: id(), type: 'pill-green', content: 'Request handled' },
  ]
}

// ── Main component ─────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 sticky top-0 z-10">
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <Heart className="w-4 h-4 text-white fill-white" />
        </div>
        <span className="font-semibold text-gray-900">Amphelo</span>
        <div className="flex-1" />
        <button
          onClick={() => router.push('/demo')}
          className="text-xs text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700 px-3 py-1.5 rounded-lg transition-colors mr-2"
        >
          Update Care Profile
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-700 text-xs font-semibold">A</span>
          </div>
          <span className="text-sm font-medium text-gray-700">Audrey</span>
        </div>
      </header>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="max-w-5xl mx-auto flex gap-0">
          {(['dashboard', 'requests'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors capitalize ${
                tab === t
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'dashboard' ? 'Dashboard' : 'Requests'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'dashboard' ? <DashboardTab /> : <RequestsTab />}
      </div>
    </div>
  )
}

// ── Dashboard tab ──────────────────────────────────────────────────────────

function DashboardTab() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <CareNetworkGrid />
      <CareItemsTracker />
      <RecentRequestsPreview />
    </div>
  )
}

function CareNetworkGrid() {
  const panels = [
    {
      icon: <User className="w-3.5 h-3.5" />,
      label: 'Prescribers',
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100 text-blue-600',
      items: CARE_NETWORK.prescribers.map(p => `${p.name} (${p.detail})`),
    },
    {
      icon: <Pill className="w-3.5 h-3.5" />,
      label: 'Medications',
      bg: 'bg-green-50',
      iconBg: 'bg-green-100 text-green-600',
      items: CARE_NETWORK.medications,
    },
    {
      icon: <Monitor className="w-3.5 h-3.5" />,
      label: 'Devices (Pharmacy)',
      bg: 'bg-sky-50',
      iconBg: 'bg-sky-100 text-sky-600',
      items: CARE_NETWORK.devices,
    },
    {
      icon: <Building2 className="w-3.5 h-3.5" />,
      label: 'Pharmacies',
      bg: 'bg-emerald-50',
      iconBg: 'bg-emerald-100 text-emerald-600',
      items: CARE_NETWORK.pharmacies.map(p => `${p.name} — ${p.address} · ${p.phone}`),
    },
    {
      icon: <Shield className="w-3.5 h-3.5" />,
      label: 'Insurance',
      bg: 'bg-teal-50',
      iconBg: 'bg-teal-100 text-teal-600',
      items: CARE_NETWORK.insurance,
    },
    {
      icon: <Phone className="w-3.5 h-3.5" />,
      label: 'Manufacturer Support',
      bg: 'bg-purple-50',
      iconBg: 'bg-purple-100 text-purple-600',
      items: CARE_NETWORK.manufacturerSupport.map(m => `${m.name} — ${m.phone}`),
    },
  ]

  return (
    <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <Heart className="w-4 h-4 text-blue-600 fill-blue-600" />
        <h2 className="font-semibold text-gray-900">Your Care Network</h2>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {panels.map(panel => (
          <div key={panel.label} className={`${panel.bg} rounded-xl p-4 space-y-2`}>
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-md flex items-center justify-center ${panel.iconBg}`}>
                {panel.icon}
              </div>
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{panel.label}</span>
            </div>
            <ul className="space-y-1">
              {panel.items.map((item, i) => (
                <li key={i} className="text-xs text-gray-700 flex gap-1.5">
                  <span className="text-gray-400 flex-shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

function CareItemsTracker() {
  return (
    <div className="space-y-4">
      {/* Prescriptions */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Pill className="w-4 h-4 text-gray-500" />
          <h3 className="font-semibold text-gray-900 text-sm">Prescriptions</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {PRESCRIPTIONS.map(rx => (
            <div key={rx.name} className="px-5 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{rx.name}</p>
                <p className="text-xs text-gray-500">{rx.format}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-xs text-gray-600">Next refill: <span className="font-medium">{rx.nextRefill}</span></p>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">in {rx.daysAway} days</p>
              </div>
              <StatusBadge status={rx.status} />
              {rx.agentNote && (
                <span className="text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full whitespace-nowrap hidden lg:block">
                  {rx.agentNote}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Devices */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Monitor className="w-4 h-4 text-gray-500" />
          <h3 className="font-semibold text-gray-900 text-sm">Devices</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {DEVICES.map(d => (
            <div key={d.name} className="px-5 py-4 flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{d.name}</p>
                <p className="text-xs text-gray-500">{d.type}</p>
              </div>
              <p className="text-xs text-gray-500">{d.note}</p>
              <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium">Active</span>
            </div>
          ))}
        </div>
      </div>

      {/* Appointments */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <h3 className="font-semibold text-gray-900 text-sm">Appointments</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {APPOINTMENTS.map(a => (
            <div key={a.doctor} className="px-5 py-4 flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{a.doctor}</p>
                <p className="text-xs text-gray-500">{a.specialty}</p>
              </div>
              {a.status === 'unscheduled' ? (
                <>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Last visit: <span className="font-medium text-gray-700">{a.lastVisit}</span></p>
                    <p className="text-xs text-gray-400 mt-0.5">No appointment scheduled</p>
                  </div>
                  <button className="text-xs font-medium text-blue-600 border border-blue-300 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors">
                    Schedule Now
                  </button>
                </>
              ) : (
                <>
                  <div className="text-right">
                    <p className="text-xs font-medium text-gray-700">{a.date} at {a.time}</p>
                    <p className="text-xs text-gray-400 mt-0.5">in {a.daysAway} days</p>
                  </div>
                  <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium">Confirmed</span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RecentRequestsPreview() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 text-sm">Recent Requests</h3>
        <span className="text-xs text-gray-400">Last 3</span>
      </div>
      <div className="divide-y divide-gray-50">
        {RECENT_REQUESTS.map(r => (
          <div key={r.id} className="px-5 py-4 flex items-start gap-4">
            <div className="mt-0.5">
              {r.status === 'resolved' ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{r.summary}</p>
              <p className="text-xs text-gray-500 mt-0.5">{r.outcome}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-gray-400">{r.date}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${
                r.status === 'resolved'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {r.status === 'resolved' ? 'Resolved' : 'In Progress'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: 'due-soon' | 'on-track' }) {
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${
      status === 'due-soon'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-green-100 text-green-700'
    }`}>
      {status === 'due-soon' ? 'Due soon' : 'On track'}
    </span>
  )
}

// ── Requests tab ───────────────────────────────────────────────────────────

function RequestsTab() {
  const [messages, setMessages] = useState<ReqMsg[]>(PRELOADED_CHAT)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const addMsg = useCallback((msg: ReqMsg) => {
    setMessages(prev => [...prev, msg])
  }, [])

  const handleSubmit = () => {
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    setBusy(true)

    const userMsg: ReqMsg = { id: `u-${Date.now()}`, type: 'user', content: text }
    setMessages(prev => [...prev, userMsg])

    const scenario = getScenario(text)
    let delay = 1200

    scenario.forEach((msg, i) => {
      const isPill = msg.type.startsWith('pill-')
      const isLast = i === scenario.length - 1

      if (!isPill && i === 0) {
        setTimeout(() => setIsTyping(true), delay - 400)
      }

      setTimeout(() => {
        if (!isPill) setIsTyping(false)
        addMsg(msg)
        if (isLast) setBusy(false)
      }, delay)

      delay += isPill ? 1800 : 2400
    })
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-6 flex flex-col" style={{ height: 'calc(100vh - 113px)' }}>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col flex-1 overflow-hidden">
        {/* Chat header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h3 className="font-semibold text-gray-900">Ad Hoc Requests</h3>
          <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">
            Coordinator ready
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
          {messages.map(msg => <ChatBubble key={msg.id} msg={msg} />)}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
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
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <div className="flex gap-3 items-end">
            <textarea
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              placeholder="Describe what's going on and I'll handle it..."
              disabled={busy}
              className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || busy}
              className="bg-blue-600 text-white rounded-xl p-2.5 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Try: "my G7 sensor just failed" · "I need an insulin refill" · "reschedule my endo appointment"
          </p>
        </div>
      </div>
    </div>
  )
}

function ChatBubble({ msg }: { msg: ReqMsg }) {
  if (msg.type === 'user') {
    return (
      <div className="flex justify-end">
        <div className="bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm max-w-md leading-relaxed">
          {msg.content}
        </div>
      </div>
    )
  }

  if (msg.type === 'amphelo') {
    return (
      <div className="flex justify-start">
        <div
          className="bg-gray-100 text-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 text-sm max-w-md leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: msg.content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'),
          }}
        />
      </div>
    )
  }

  if (msg.type === 'pill-blue') {
    return (
      <div className="flex justify-start">
        <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 text-xs px-3 py-1.5 rounded-full font-medium">
          <Phone className="w-3 h-3" /> {msg.content}
        </span>
      </div>
    )
  }

  if (msg.type === 'pill-amber') {
    return (
      <div className="flex justify-start">
        <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs px-3 py-1.5 rounded-full font-medium">
          <Phone className="w-3 h-3" /> {msg.content}
        </span>
      </div>
    )
  }

  if (msg.type === 'pill-green') {
    return (
      <div className="flex justify-start">
        <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs px-3 py-1.5 rounded-full font-medium">
          <CheckCircle2 className="w-3 h-3" /> {msg.content}
        </span>
      </div>
    )
  }

  return null
}
