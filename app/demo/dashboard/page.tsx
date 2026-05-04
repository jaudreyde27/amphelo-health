'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Heart, User, Pill, Monitor, Building2, Shield, Phone, Send,
  CheckCircle2, AlertCircle, Calendar, Settings, Map, Stethoscope,
  Star, MapPin, Edit2, Check, X,
} from 'lucide-react'

type Tab = 'dashboard' | 'requests' | 'pharmacy-map' | 'specialists' | 'settings'

// ── Demo data ──────────────────────────────────────────────────────────────

const CARE_NETWORK = {
  prescribers: [
    { name: 'Dr. Anita Patel', specialty: 'Endocrinology', system: 'Mount Sinai', address: '1 Gustave L. Levy Pl, New York, NY 10029', phone: '(212) 241-6500', visitFrequency: 'Every 3 months' },
    { name: 'Dr. James Liu', specialty: 'Primary Care', system: 'Mount Sinai', address: '17 E 102nd St, New York, NY 10029', phone: '(212) 241-7000', visitFrequency: 'Every 6 months' },
    { name: 'Dr. Sarah Kim', specialty: 'Ophthalmology', system: 'Mount Sinai', address: '17 E 102nd St, New York, NY 10029', phone: '(212) 241-8500', visitFrequency: 'Annually' },
  ],
  medications: ['Humalog 100u/mL KwikPen', 'Tresiba 100u/mL FlexTouch'],
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
]

const DEVICES = [
  { name: 'Dexcom G7 Sensors (3-pack)', type: 'CGM Sensor Supply', nextRefill: 'Jun 30, 2026', daysAway: 58, status: 'on-track' as const, agentNote: null },
  { name: 'Omnipod 5 Pods (2×5-pack)', type: 'Pump Supply', nextRefill: 'May 10, 2026', daysAway: 7, status: 'due-soon' as const, agentNote: 'Refill request queued' },
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

const SPECIALISTS = [
  { name: 'Dr. Maya Patel', practice: 'UCSF Diabetes Center', address: '400 Parnassus Ave, San Francisco', distance: '0.8 mi', rating: 4.9, reviews: 142, t1dSpecialized: true, acceptsInsurance: true, topReview: "She's been managing my Type 1 for 6 years. She actually understands the CGM data and adjusts my basal rates herself — I've never had to explain what a Dexcom is." },
  { name: 'Dr. Robert Chen', practice: 'Kaiser Permanente Endocrinology', address: '2238 Geary Blvd, San Francisco', distance: '1.2 mi', rating: 4.7, reviews: 89, t1dSpecialized: true, acceptsInsurance: true, topReview: "As a T1D since age 9, I've seen a lot of endos. Dr. Chen is one of the few who treats T1 and T2 completely differently. He's fluent in closed-loop systems and helped me get my Omnipod 5 covered." },
  { name: 'Dr. Jennifer Walsh', practice: 'Stanford Medicine Partners', address: '100 S Van Ness Ave, San Francisco', distance: '2.1 mi', rating: 4.8, reviews: 211, t1dSpecialized: true, acceptsInsurance: true, topReview: "Finally a doctor who knows Type 1 inside and out. She set up my DIY looping, navigated my prior auth for Humalog, and responds to MyChart messages within the hour during a hypoglycemic episode." },
  { name: 'Dr. David Kim', practice: 'CPMC Endocrinology', address: '3801 Sacramento St, San Francisco', distance: '1.5 mi', rating: 4.6, reviews: 73, t1dSpecialized: false, acceptsInsurance: true, topReview: "Good general endocrinologist. He's more Type 2-focused but was willing to learn about my Omnipod setup. Not a T1 specialist, but thorough and easy to get appointments with." },
]

// ── Pre-loaded chat ─────────────────────────────────────────────────────────

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
  if (t.includes('appointment') || t.includes('doctor') || t.includes('reschedule')) {
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

// ── Main component ──────────────────────────────────────────────────────────

const TAB_LABELS: Record<Tab, string> = {
  dashboard: 'Dashboard',
  requests: 'Requests',
  'pharmacy-map': 'Pharmacy Map',
  specialists: 'Specialists',
  settings: 'Settings',
}

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
        <button onClick={() => router.push('/demo')} className="text-xs text-gray-400 hover:text-gray-600 transition-colors mr-3">
          Back to Intake
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-700 text-xs font-semibold">A</span>
          </div>
          <span className="text-sm font-medium text-gray-700">Audrey</span>
        </div>
      </header>

      <div className="bg-white border-b border-gray-200 px-6 overflow-x-auto">
        <div className="max-w-5xl mx-auto flex gap-0 min-w-max">
          {(Object.keys(TAB_LABELS) as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'requests' && <RequestsTab />}
        {tab === 'settings' && <SettingsTab />}
        {tab === 'pharmacy-map' && <PharmacyMapTab />}
        {tab === 'specialists' && <SpecialistFinderTab />}
      </div>
    </div>
  )
}

// ── Dashboard tab ───────────────────────────────────────────────────────────

function DashboardTab() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <PhysiciansSection />
      <CareNetworkGrid />
      <CareItemsTracker />
      <RecentRequestsPreview />
    </div>
  )
}

function PhysiciansSection() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <User className="w-4 h-4 text-gray-500" />
        <h3 className="font-semibold text-gray-900 text-sm">Care Team</h3>
      </div>
      <div className="divide-y divide-gray-50">
        {CARE_NETWORK.prescribers.map(p => (
          <div key={p.name} className="px-5 py-4 flex items-start gap-5">
            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0 grid grid-cols-2 gap-x-6 gap-y-0.5">
              <div>
                <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{p.specialty} · {p.system}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <p className="text-xs text-gray-600">{p.phone}</p>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <p className="text-xs text-gray-500">{p.address}</p>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <p className="text-xs text-gray-500">Recommended: <span className="font-medium text-gray-700">{p.visitFrequency}</span></p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CareNetworkGrid() {
  const panels = [
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
            {'custom' in panel ? panel.custom : (
              <ul className="space-y-1">
                {(panel.items ?? []).map((item, i) => (
                  <li key={i} className="text-xs text-gray-700 flex gap-1.5">
                    <span className="text-gray-400 flex-shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
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
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{d.name}</p>
                <p className="text-xs text-gray-500">{d.type}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-xs text-gray-600">Next refill: <span className="font-medium">{d.nextRefill}</span></p>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">in {d.daysAway} days</p>
              </div>
              <StatusBadge status={d.status} />
              {d.agentNote && (
                <span className="text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full whitespace-nowrap hidden lg:block">
                  {d.agentNote}
                </span>
              )}
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
              {r.status === 'resolved'
                ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                : <AlertCircle className="w-4 h-4 text-amber-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{r.summary}</p>
              <p className="text-xs text-gray-500 mt-0.5">{r.outcome}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-gray-400">{r.date}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${
                r.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
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
      status === 'due-soon' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
    }`}>
      {status === 'due-soon' ? 'Due soon' : 'On track'}
    </span>
  )
}

// ── Requests tab ────────────────────────────────────────────────────────────

function RequestsTab() {
  const [messages, setMessages] = useState<ReqMsg[]>(PRELOADED_CHAT)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping])

  const addMsg = useCallback((msg: ReqMsg) => setMessages(prev => [...prev, msg]), [])

  const handleSubmit = () => {
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    setBusy(true)
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, type: 'user', content: text }])
    const scenario = getScenario(text)
    let delay = 1200
    scenario.forEach((msg, i) => {
      const isPill = msg.type.startsWith('pill-')
      if (!isPill && i === 0) setTimeout(() => setIsTyping(true), delay - 400)
      setTimeout(() => {
        if (!isPill) setIsTyping(false)
        addMsg(msg)
        if (i === scenario.length - 1) setBusy(false)
      }, delay)
      delay += isPill ? 1800 : 2400
    })
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-6 flex flex-col" style={{ height: 'calc(100vh - 121px)' }}>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col flex-1 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h3 className="font-semibold text-gray-900">Ad Hoc Requests</h3>
          <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">Coordinator ready</span>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
          {messages.map(msg => <ChatBubble key={msg.id} msg={msg} />)}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-4">
                  {[0, 150, 300].map(d => (
                    <span key={d} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <div className="flex gap-3 items-end">
            <textarea rows={1} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() } }}
              placeholder="Describe what's going on and I'll handle it..."
              disabled={busy}
              className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button onClick={handleSubmit} disabled={!input.trim() || busy}
              className="bg-blue-600 text-white rounded-xl p-2.5 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0">
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
  if (msg.type === 'user') return (
    <div className="flex justify-end">
      <div className="bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm max-w-md leading-relaxed">{msg.content}</div>
    </div>
  )
  if (msg.type === 'amphelo') return (
    <div className="flex justify-start">
      <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 text-sm max-w-md leading-relaxed"
        dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
    </div>
  )
  if (msg.type === 'pill-blue') return (
    <div className="flex justify-start">
      <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 text-xs px-3 py-1.5 rounded-full font-medium">
        <Phone className="w-3 h-3" /> {msg.content}
      </span>
    </div>
  )
  if (msg.type === 'pill-amber') return (
    <div className="flex justify-start">
      <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs px-3 py-1.5 rounded-full font-medium">
        <Phone className="w-3 h-3" /> {msg.content}
      </span>
    </div>
  )
  if (msg.type === 'pill-green') return (
    <div className="flex justify-start">
      <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs px-3 py-1.5 rounded-full font-medium">
        <CheckCircle2 className="w-3 h-3" /> {msg.content}
      </span>
    </div>
  )
  return null
}

// ── Settings tab ────────────────────────────────────────────────────────────

function SettingsTab() {
  const [editing, setEditing] = useState<string | null>(null)

  const sections = [
    {
      id: 'prescribers',
      title: 'Care Team',
      icon: <User className="w-4 h-4 text-gray-500" />,
      rows: CARE_NETWORK.prescribers.map(p => ({
        primary: p.name,
        secondary: `${p.specialty} · ${p.system} · ${p.visitFrequency}`,
        tertiary: `${p.address} · ${p.phone}`,
      })),
    },
    {
      id: 'prescriptions',
      title: 'Prescriptions',
      icon: <Pill className="w-4 h-4 text-gray-500" />,
      rows: PRESCRIPTIONS.map(rx => ({
        primary: rx.name,
        secondary: `${rx.format} · Every 4 weeks`,
        tertiary: null,
      })),
    },
    {
      id: 'devices',
      title: 'Devices & Supplies',
      icon: <Monitor className="w-4 h-4 text-gray-500" />,
      rows: DEVICES.map(d => ({
        primary: d.name,
        secondary: d.type,
        tertiary: null,
      })),
    },
    {
      id: 'pharmacies',
      title: 'Pharmacies',
      icon: <Building2 className="w-4 h-4 text-gray-500" />,
      rows: CARE_NETWORK.pharmacies.map(p => ({
        primary: p.name,
        secondary: p.address,
        tertiary: p.phone,
      })),
    },
    {
      id: 'insurance',
      title: 'Insurance',
      icon: <Shield className="w-4 h-4 text-gray-500" />,
      rows: [
        { primary: 'Blue Shield PPO (Commercial)', secondary: 'Plan #BSC-PPO-2024-001 · Group #GRP-88412', tertiary: '1-800-541-6765' },
      ],
    },
    {
      id: 'manufacturer',
      title: 'Manufacturer Support',
      icon: <Phone className="w-4 h-4 text-gray-500" />,
      rows: CARE_NETWORK.manufacturerSupport.map(m => ({
        primary: m.name,
        secondary: m.phone,
        tertiary: null,
      })),
    },
  ]

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Care Profile Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Review and update your care network details.</p>
      </div>
      {sections.map(section => (
        <div key={section.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {section.icon}
              <h3 className="font-semibold text-gray-900 text-sm">{section.title}</h3>
            </div>
            <button
              onClick={() => setEditing(editing === section.id ? null : section.id)}
              className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                editing === section.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {editing === section.id ? <><Check className="w-3 h-3" /> Save</> : <><Edit2 className="w-3 h-3" /> Edit</>}
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {section.rows.map((row, i) => (
              <div key={i} className="px-5 py-3.5">
                {editing === section.id ? (
                  <div className="space-y-1.5">
                    <input defaultValue={row.primary} className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    {row.secondary && <input defaultValue={row.secondary} className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600" />}
                    {row.tertiary && <input defaultValue={row.tertiary} className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600" />}
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-900">{row.primary}</p>
                    {row.secondary && <p className="text-xs text-gray-500 mt-0.5">{row.secondary}</p>}
                    {row.tertiary && <p className="text-xs text-gray-500">{row.tertiary}</p>}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Pharmacy Map tab ────────────────────────────────────────────────────────

const PHARMACY_LOCATIONS = [
  { name: 'CVS Pharmacy', address: '1420 Market St', distance: '0.3 mi', hours: 'Open until 10 PM', inNetwork: true },
  { name: 'CVS Pharmacy', address: '2100 Mission St', distance: '0.8 mi', hours: 'Open until 9 PM', inNetwork: true },
  { name: 'CVS Pharmacy', address: '3701 18th St', distance: '1.1 mi', hours: 'Open until 10 PM', inNetwork: true },
]

function PharmacyMapTab() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Pharmacy Map</h2>
        <p className="text-sm text-gray-500 mt-0.5">CVS Pharmacy locations near San Francisco, CA</p>
      </div>

      <div className="grid grid-cols-5 gap-4 h-[480px]">
        {/* Map */}
        <div className="col-span-3 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative">
          <iframe
            title="pharmacy-map"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            src="https://maps.google.com/maps?q=CVS+Pharmacy+San+Francisco+CA&output=embed"
          />
        </div>

        {/* Pharmacy list */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">{PHARMACY_LOCATIONS.length} locations found</p>
          </div>
          <div className="divide-y divide-gray-50">
            {PHARMACY_LOCATIONS.map((p, i) => (
              <div key={i} className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{p.address}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{p.hours}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-medium text-blue-600">{p.distance}</span>
                    {p.inNetwork && (
                      <div className="mt-1">
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">In-network</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Specialist Finder tab ───────────────────────────────────────────────────

function SpecialistFinderTab() {
  const [specialty, setSpecialty] = useState('Endocrinology')

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Specialist Finder</h2>
        <p className="text-sm text-gray-500 mt-0.5">Specialists near you who accept Blue Shield PPO and are reviewed for T1D care.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Specialty</label>
          <select value={specialty} onChange={e => setSpecialty(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option>Endocrinology</option>
            <option>Ophthalmology</option>
            <option>Primary Care</option>
            <option>Nephrology</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Insurance</label>
          <span className="text-sm text-gray-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">Blue Shield PPO</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</label>
          <span className="text-sm text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-gray-400" /> San Francisco, CA
          </span>
        </div>
        <span className="text-xs text-gray-400 ml-auto">{SPECIALISTS.length} results</span>
      </div>

      {/* Results */}
      <div className="space-y-3">
        {SPECIALISTS.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 space-y-3">
            <div className="flex items-start gap-5">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Stethoscope className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                  {s.t1dSpecialized && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">T1D Specialized</span>
                  )}
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Accepts Blue Shield PPO</span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">{s.practice}</p>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {s.address} · {s.distance}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1 justify-end">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-sm font-semibold text-gray-900">{s.rating}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{s.reviews} reviews</p>
                <button className="mt-2 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Request Referral
                </button>
              </div>
            </div>
            <div className={`rounded-xl px-4 py-3 border-l-2 ${s.t1dSpecialized ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'}`}>
              <p className={`text-xs leading-relaxed italic ${s.t1dSpecialized ? 'text-blue-800' : 'text-gray-600'}`}>"{s.topReview}"</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
