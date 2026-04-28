'use client'

import { useState } from 'react'
import { submitTrialSignup } from '@/app/actions/trial'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function TrialSignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [country, setCountry] = useState('US')
  const [zipcode, setZipcode] = useState('')
  const [userType, setUserType] = useState<'parent' | 'adult-t1d'>('parent')
  const [planType, setPlanType] = useState<'adhoc' | 'full'>('full')
  const [isDesignPartner, setIsDesignPartner] = useState(false)
  const [phone, setPhone] = useState('')
  const [bestTimeToReach, setBestTimeToReach] = useState('early-am')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name || !email) {
      setError('Please fill in all required fields')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    if (country === 'US' && !zipcode) {
      setError('Please enter your zipcode')
      return
    }

    if (isDesignPartner && !phone) {
      setError('Please enter your phone number for design partner contact')
      return
    }

    setIsSubmitting(true)

    try {
      await submitTrialSignup({
        name,
        email,
        country,
        zipcode: country === 'US' ? zipcode : '',
        userType,
        isDesignPartner,
        phone: isDesignPartner ? phone : '',
        bestTimeToReach: isDesignPartner ? bestTimeToReach : '',
      })
    } catch (err) {
      setIsSubmitting(false)
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.')
    }
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="py-4 sm:py-6 px-4 sm:px-6 border-b border-accent/20 sticky top-0 gradient-bg/95 backdrop-blur-sm z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 text-accent hover:text-accent/80 transition-colors">
            ← Back
          </Link>
          <span className="accent-text font-bold text-sm sm:text-base">Amphelo Health</span>
          <div className="w-12 sm:w-16" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 mb-6">
              Join our waitlist
            </h1>
            <ul className="text-left inline-flex flex-col gap-3 text-base sm:text-lg text-neutral-700">
              <li className="flex items-start gap-3">
                <span className="mt-1 w-5 h-5 rounded-full bg-accent/15 text-accent flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                24/7/365 Personalized care coordinator, ready for requests on demand
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 w-5 h-5 rounded-full bg-accent/15 text-accent flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                Full visibility and streamlined management of all prescriptions, devices, and appointments
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 w-5 h-5 rounded-full bg-accent/15 text-accent flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                Amphelo Perseverance Guarantee: Your care admin problem gets solved, 100% of the time.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 w-5 h-5 rounded-full bg-accent/15 text-accent flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                HIPAA compliant, privacy first
              </li>

            </ul>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 border-2 border-accent/20">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex gap-2 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* I am a... — first so it's immediately visible */}
              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-2">
                  I am a...
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUserType('parent')}
                    className={`py-3 px-4 rounded-lg font-medium transition-all text-sm ${
                      userType === 'parent'
                        ? 'bg-accent text-white border-2 border-accent'
                        : 'bg-neutral-100 text-neutral-900 border-2 border-neutral-200 hover:border-accent'
                    }`}
                  >
                    Parent of T1D Child
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType('adult-t1d')}
                    className={`py-3 px-4 rounded-lg font-medium transition-all text-sm ${
                      userType === 'adult-t1d'
                        ? 'bg-accent text-white border-2 border-accent'
                        : 'bg-neutral-100 text-neutral-900 border-2 border-neutral-200 hover:border-accent'
                    }`}
                  >
                    Adult with T1D
                  </button>
                </div>
              </div>

              {/* I am interested in... */}
              <div>
                <label className="block text-sm font-medium text-neutral-900 mb-2">
                  I am interested in...
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => setPlanType('adhoc')}
                      className={`py-3 px-4 rounded-lg font-medium transition-all text-sm ${
                        planType === 'adhoc'
                          ? 'bg-accent text-white border-2 border-accent'
                          : 'bg-neutral-100 text-neutral-900 border-2 border-neutral-200 hover:border-accent'
                      }`}
                    >
                      Amphelo Core
                    </button>
                    <p className="text-xs text-neutral-500 text-center">$8/request, after free trial</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => setPlanType('full')}
                      className={`py-3 px-4 rounded-lg font-medium transition-all text-sm ${
                        planType === 'full'
                          ? 'bg-accent text-white border-2 border-accent'
                          : 'bg-neutral-100 text-neutral-900 border-2 border-neutral-200 hover:border-accent'
                      }`}
                    >
                      Amphelo Plus
                    </button>
                    <p className="text-xs text-neutral-500 text-center">$35/month, after free trial</p>
                  </div>
                </div>
              </div>

              {/* Name + Email side by side on larger screens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>
              </div>

              {/* Country + Zipcode side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Country
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-white"
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="OTHER">Rest of World</option>
                  </select>
                </div>
                {country === 'US' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Zipcode
                    </label>
                    <input
                      type="text"
                      value={zipcode}
                      onChange={(e) => setZipcode(e.target.value)}
                      placeholder="90210"
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              <div className="border-t border-neutral-200 pt-5">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDesignPartner}
                    onChange={(e) => setIsDesignPartner(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-current"
                  />
                  <span className="text-sm text-neutral-900">
                    Would you like to be contacted as a Design Partner for Amphelo? This will earn you credits towards your future Amphelo subscription.
                  </span>
                </label>
              </div>

              {isDesignPartner && (
                <div className="space-y-4 bg-accent/5 p-4 sm:p-5 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-2">
                      Best Time to Reach You
                    </label>
                    <select
                      value={bestTimeToReach}
                      onChange={(e) => setBestTimeToReach(e.target.value)}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-white"
                    >
                      <option value="early-am">Early AM (6–10am)</option>
                      <option value="late-am">Late AM (10am–12pm)</option>
                      <option value="early-pm">Early PM (12–4pm)</option>
                      <option value="late-pm">Late PM (4–8pm)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-accent text-white py-4 rounded-lg font-semibold hover:bg-accent/90 transition-colors text-base sm:text-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Joining waitlist...' : 'Sign up for our waitlist now'}
              </button>


            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
