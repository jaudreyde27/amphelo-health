'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Send, Pill, RefreshCw, Zap, Phone,
  CheckCircle2, XCircle, Loader2, Sparkles
} from 'lucide-react'
import Navigation from '@/components/Navigation'
import { getState, addMessage, addWorkflow } from '@/lib/storage'
import { createAdHocWorkflow } from '@/lib/workflows'
import type { AppState, ChatMessage, Medication } from '@/lib/types'

function uuid() { return Math.random().toString(36).slice(2) + Date.now().toString(36) }

function CallStatus({ status }: { status?: ChatMessage['callStatus'] }) {
  if (!status) return null
  const cfg = {
    initiating:  { icon: Loader2, text: 'Initiating call to pharmacy...', spin: true,  cls: 'bg-blue-50 text-blue-600 border-blue-100' },
    in_progress: { icon: Phone,   text: 'Call in progress',               spin: false, cls: 'bg-violet-50 text-violet-600 border-violet-100' },
    completed:   { icon: CheckCircle2, text: 'Call completed successfully',spin: false, cls: 'bg-teal-50 text-teal-600 border-teal-100' },
    failed:      { icon: XCircle, text: 'Call failed — please try again', spin: false, cls: 'bg-red-50 text-red-600 border-red-100' },
  }[status]
  const Icon = cfg.icon
  return (
    <div className={`flex items-center gap-2 mt-2 px-3 py-2 rounded-xl border text-xs font-medium w-fit ${cfg.cls}`}>
      <Icon className={`w-3.5 h-3.5 ${cfg.spin ? 'animate-spin' : ''}`} />
      {cfg.text}
    </div>
  )
}

function Bubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-5`}>
      {!isUser && (
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center mr-3 mt-1 shrink-0 shadow-sm shadow-blue-200">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div className={`max-w-sm ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed
          ${isUser
            ? 'bg-blue-600 text-white rounded-tr-sm shadow-sm shadow-blue-200'
            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
          }`}>
          {msg.content}
        </div>
        <CallStatus status={msg.callStatus} />
        <p className="text-xs text-slate-400 mt-1.5 px-1">
          {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}

async function triggerCall(params: object) {
  const res = await fetch('/api/call', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  return res.json()
}

export default function ChatPage() {
  const router = useRouter()
  const [appState, setAppState] = useState<AppState | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const s = getState()
    if (!s.onboardingComplete) { router.replace('/onboarding'); return }
    setAppState(s)
    if (s.messages.length === 0) {
      const welcome: ChatMessage = {
        id: uuid(), role: 'assistant', timestamp: new Date().toISOString(),
        content: `Hi ${s.profile?.name?.split(' ')[0] ?? 'there'}! I'm your Amphelo care coordinator. I can request prescription refills, check statuses, and handle any pharmacy needs on your behalf. What can I help you with today?`,
      }
      addMessage(welcome)
      setMessages([welcome])
    } else {
      setMessages(s.messages)
    }
  }, [router])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const pushMsg = (msg: ChatMessage) => { addMessage(msg); setMessages(p => [...p, msg]) }

  const parseIntent = (text: string) => {
    const lower = text.toLowerCase()
    const meds = appState?.medications ?? []
    const found = meds.find(m => lower.includes(m.name.toLowerCase()))
    if (lower.includes('refill') || lower.includes('fill')) return { type: 'refill' as const, med: found }
    if (lower.includes('status') || lower.includes('ready') || lower.includes('check')) return { type: 'status_check' as const, med: found }
    if (lower.includes('new prescription') || lower.includes('new rx')) return { type: 'new_prescription' as const, med: undefined }
    return { type: 'custom' as const, med: found }
  }

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || loading || !appState) return
    setInput('')
    if (textareaRef.current) { textareaRef.current.style.height = 'auto' }
    setLoading(true)

    pushMsg({ id: uuid(), role: 'user', content, timestamp: new Date().toISOString() })

    const { type, med: detectedMed } = parseIntent(content)
    const meds = appState.medications
    const pharmacies = appState.pharmacies
    let targetMed: Medication | undefined = detectedMed

    if (!targetMed && meds.length === 1) targetMed = meds[0]

    if ((type === 'refill' || type === 'status_check') && !targetMed && meds.length > 1) {
      pushMsg({
        id: uuid(), role: 'assistant', timestamp: new Date().toISOString(),
        content: `Which medication? ${meds.map(m => `**${m.name}**`).join(' or ')}?`,
      })
      setLoading(false)
      return
    }

    const pharmacy = pharmacies.find(p => p.id === targetMed?.pharmacyId) ?? pharmacies[0]
    const workflowTitle = type === 'refill'
      ? `Refill ${targetMed?.name ?? 'medication'}`
      : type === 'status_check'
      ? `Status check — ${targetMed?.name ?? 'prescription'}`
      : 'Custom pharmacy request'

    pushMsg({
      id: uuid(), role: 'assistant', timestamp: new Date().toISOString(),
      content: pharmacy?.phone
        ? `On it — I'm calling ${pharmacy?.name ?? 'the pharmacy'} now.`
        : `I'll log this request. Note: no pharmacy phone on file for manual follow-up.`,
      callStatus: pharmacy?.phone ? 'initiating' : undefined,
    })

    const workflow = createAdHocWorkflow(type, workflowTitle, content, targetMed, pharmacy)
    addWorkflow(workflow)

    if (pharmacy?.phone && appState.profile) {
      try {
        const data = await triggerCall({
          pharmacyPhone: pharmacy.phone,
          patientName: appState.profile.name,
          patientDOB: appState.profile.dateOfBirth,
          patientPhone: appState.profile.phone,
          medicationName: targetMed?.name,
          medicationDosage: targetMed?.dosage,
          prescriptionNumber: targetMed?.prescriptionNumber,
          workflowType: type,
        })
        pushMsg({
          id: uuid(), role: 'assistant', timestamp: new Date().toISOString(),
          workflowId: workflow.id,
          callStatus: data.id ? 'in_progress' : 'failed',
          content: data.id
            ? `Call connected! I'm speaking with ${pharmacy.name} on your behalf. Check your dashboard for live status updates.`
            : `Something went wrong: ${data.error ?? 'unknown error'}. Please try again or call the pharmacy directly.`,
        })
      } catch {
        pushMsg({
          id: uuid(), role: 'assistant', timestamp: new Date().toISOString(),
          callStatus: 'failed',
          content: 'Network error while placing the call. Please check your connection and try again.',
        })
      }
    }

    setLoading(false)
    setAppState(getState())
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  if (!appState) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navigation patientName={appState.profile?.name} />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-slate-100 px-8 py-5 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-slate-900">Ad Hoc Requests</h1>
              <p className="text-xs text-slate-400 mt-0.5">Request refills, check statuses, or ask anything pharmacy-related</p>
            </div>
            <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-green-700">Coordinator ready</span>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white border-b border-slate-100 px-8 py-3 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <span className="text-xs text-slate-400 shrink-0">Quick:</span>
            {appState.medications.map(med => (
              <button key={med.id} onClick={() => handleSend(`I need to refill my ${med.name} ${med.dosage}`)} disabled={loading}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100 hover:bg-blue-100 transition-colors whitespace-nowrap disabled:opacity-50 shrink-0">
                <Pill className="w-3 h-3" />Refill {med.name}
              </button>
            ))}
            <button onClick={() => handleSend('What is the status of my prescriptions?')} disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-50 text-slate-600 text-xs font-semibold rounded-full border border-slate-200 hover:bg-slate-100 transition-colors whitespace-nowrap disabled:opacity-50 shrink-0">
              <RefreshCw className="w-3 h-3" />Check status
            </button>
            <button onClick={() => handleSend('I have a new prescription I need filled')} disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-50 text-slate-600 text-xs font-semibold rounded-full border border-slate-200 hover:bg-slate-100 transition-colors whitespace-nowrap disabled:opacity-50 shrink-0">
              <Zap className="w-3 h-3" />New prescription
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {messages.map(msg => <Bubble key={msg.id} msg={msg} />)}
          {loading && (
            <div className="flex justify-start mb-5">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center mr-3 shrink-0 shadow-sm shadow-blue-200">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-5 py-3.5 shadow-sm">
                <div className="flex gap-1.5 items-center">
                  {[0, 150, 300].map(d => (
                    <span key={d} className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"
                      style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-slate-100 px-8 py-5 shrink-0">
          <div className="flex items-end gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus-within:border-blue-300 focus-within:bg-white transition-colors">
            <textarea
              ref={textareaRef}
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none min-h-[24px] max-h-32"
              placeholder="Ask about your medications, request a refill, check status..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              onInput={e => {
                const t = e.currentTarget
                t.style.height = 'auto'
                t.style.height = `${Math.min(t.scrollHeight, 128)}px`
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 shadow-sm shadow-blue-200"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">Enter to send · Shift+Enter for new line</p>
        </div>
      </main>
    </div>
  )
}
