'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Heart, Pill, Calendar, MessageSquare, CheckCircle2,
  ArrowRight, Phone, Clock, Shield, Sparkles, ChevronRight
} from 'lucide-react'
import { isOnboardingComplete } from '@/lib/storage'

const FEATURES = [
  {
    icon: Pill,
    title: 'Smart Intake',
    desc: 'Add your medications, prescriptions, and pharmacy once. We handle everything from there.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Calendar,
    title: 'Automated Workflows',
    desc: 'We create personalized refill schedules and call your pharmacy at exactly the right time.',
    color: 'bg-teal-50 text-teal-600',
  },
  {
    icon: MessageSquare,
    title: 'On-Demand Requests',
    desc: 'Need an urgent refill or have a question? Chat and we\'ll call the pharmacy for you instantly.',
    color: 'bg-violet-50 text-violet-600',
  },
]

const STEPS = [
  { n: '01', title: 'Tell us about your care', desc: 'Enter your medications, prescription numbers, and pharmacy details in a simple 4-step intake.' },
  { n: '02', title: 'Review your workflows', desc: 'We build a personalized schedule of automated calls. Approve them with one click.' },
  { n: '03', title: 'We handle the calls', desc: 'Our AI coordinator calls your pharmacy, handles the conversation, and logs everything back to you.' },
]

// Mini dashboard mockup for hero
function DashboardPreview() {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-teal-400/20 blur-3xl rounded-3xl" />

      <div className="relative bg-white rounded-2xl border border-slate-200 card-shadow-lg overflow-hidden text-left">
        {/* Mini nav */}
        <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-300" />
            <div className="w-3 h-3 rounded-full bg-amber-300" />
            <div className="w-3 h-3 rounded-full bg-green-300" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-white border border-slate-200 rounded px-8 py-1 text-xs text-slate-400">amphelo.health</div>
          </div>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-36 bg-white border-r border-slate-100 p-3 space-y-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <Heart className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs font-bold text-slate-800">Amphelo</span>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-2 py-1.5">
              <Calendar className="w-3 h-3 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">Dashboard</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <MessageSquare className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-500">Requests</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 space-y-3">
            <p className="text-sm font-bold text-slate-900">Good morning, Sarah 👋</p>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Pending', val: '2', color: 'text-amber-600 bg-amber-50' },
                { label: 'Scheduled', val: '3', color: 'text-blue-600 bg-blue-50' },
                { label: 'Done', val: '8', color: 'text-teal-600 bg-teal-50' },
              ].map(s => (
                <div key={s.label} className={`${s.color} rounded-lg p-2 text-center`}>
                  <p className="text-base font-bold">{s.val}</p>
                  <p className="text-xs opacity-70">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Workflow cards */}
            {[
              { name: 'Humalog 100u/mL', pharmacy: 'CVS Pharmacy', status: 'Needs Approval', sc: 'bg-amber-50 border-amber-200 text-amber-700' },
              { name: 'Dexcom G7 Sensor', pharmacy: 'Walgreens', status: 'Scheduled', sc: 'bg-blue-50 border-blue-200 text-blue-700' },
            ].map((w) => (
              <div key={w.name} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Refill {w.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <Phone className="w-2.5 h-2.5" />{w.pharmacy}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${w.sc}`}>{w.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (isOnboardingComplete()) {
      router.replace('/dashboard')
    } else {
      setChecked(true)
    }
  }, [router])

  if (!checked) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-7 h-7 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-slate-900">Amphelo Health</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              AI Coordinator Active
            </span>
            <Link
              href="/onboarding"
              className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get started
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hero-gradient pt-20 pb-28 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
              <Sparkles className="w-3 h-3" />
              AI-powered care coordination
            </div>
            <h1 className="text-5xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-6">
              Your Type One Diabetes admin,{' '}
              <span className="text-gradient">handled automatically.</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-md">
              T1D care takes a village. Amphelo helps manage your pharmacy, specialists, insurance and other stakeholders
              on your behalf — managing refills, checking statuses, and handling requests so you don't have to.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/onboarding"
                className="flex items-center gap-2 bg-blue-600 text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
              >
                Start your intake
                <ChevronRight className="w-4 h-4" />
              </Link>
              <p className="text-sm text-slate-400">Free · No account needed</p>
            </div>
            {/* Trust indicators */}
            <div className="flex items-center gap-5 mt-10 pt-8 border-t border-slate-100">
              {[
                { icon: Shield, label: 'HIPAA-compliant' },
                { icon: Phone, label: 'Real AI calls' },
                { icon: Clock, label: 'Works 24/7' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                  {label}
                </div>
              ))}
            </div>
          </div>
          <div className="hidden lg:block">
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-3">How it helps</p>
            <h2 className="text-4xl font-bold text-slate-900 tracking-tight">Everything you need, nothing you don't</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="bg-white border border-slate-200 rounded-2xl p-7 card-shadow hover:shadow-md transition-shadow">
                <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center mb-5`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-3">The process</p>
            <h2 className="text-4xl font-bold text-slate-900 tracking-tight">Up and running in minutes</h2>
          </div>
          <div className="space-y-5">
            {STEPS.map(({ n, title, desc }, i) => (
              <div key={n} className="flex gap-6 items-start bg-white rounded-2xl p-7 border border-slate-200 card-shadow">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center text-sm font-bold shrink-0">
                  {n}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-blue-600 to-blue-700">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">
            Ready to take back your time?
          </h2>
          <p className="text-blue-200 mb-8 text-lg">
            Set up in 5 minutes. We'll handle the rest.
          </p>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors shadow-xl text-sm"
          >
            Start your intake
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Heart className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">Amphelo Health</span>
          </div>
          <p className="text-xs">© 2025 Amphelo Health. Prototype.</p>
        </div>
      </footer>
    </div>
  )
}
