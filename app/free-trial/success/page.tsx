'use client'

import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

export default function TrialSuccessPage() {
  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <div className="flex justify-center mb-6">
          <CheckCircle2 className="w-16 h-16 text-emerald-600" />
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 mb-4">
          Thanks for joining our waitlist!
        </h1>

        <p className="text-lg sm:text-xl text-neutral-600 mb-4">
          Amphelo is still in development and will be launching in Fall 2026.
        </p>
        <p className="text-lg sm:text-xl text-neutral-600 mb-8">
          We will contact you about starting your free trial.
        </p>

        <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 border-2 border-accent/20 mb-8">
          <p className="text-neutral-700 mb-4">
            Have any questions? Please reach out to Audrey DeGuerrera at
          </p>
          <a
            href="mailto:jaudrey@stanford.edu"
            className="inline-block text-accent hover:underline font-medium"
          >
            jaudrey@stanford.edu
          </a>
        </div>

        <Link
          href="/"
          className="inline-block bg-accent text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-medium hover:bg-accent/90 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
