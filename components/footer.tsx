import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-blue-50 text-gray-900">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-16">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">

          {/* Left — Brand */}
          <div className="flex-shrink-0">
            <div className="text-2xl font-bold text-sky-400">Amphelo</div>
            <p className="mt-2 text-xs text-gray-600">Your T1D care coordinator.</p>
          </div>

          {/* Center — Links */}
          <div className="flex flex-col gap-3 text-sm text-gray-600">
            <Link href="/#capabilities" className="hover:text-gray-900 transition-colors">Capabilities</Link>
            <Link href="/#integrations" className="hover:text-gray-900 transition-colors">Connected Partners</Link>
            <Link href="/#pricing" className="hover:text-gray-900 transition-colors">Pricing</Link>
            <span className="text-gray-600">For Adults with T1D</span>
            <span className="text-gray-600">For Parents of kids with T1D</span>
          </div>

          {/* Right — Contact + CTA */}
          <div className="flex flex-col gap-3 text-sm text-right">
            <a
              href="mailto:hello@amphelo.com"
              className="text-gray-700 hover:text-gray-900 transition-colors"
            >
              hello@amphelo.com
            </a>
            <Link
              href="/free-trial"
              className="text-sky-400 font-semibold hover:text-sky-500 transition-colors"
            >
              Sign up for our waitlist now
            </Link>
            <p className="mt-4 text-xs text-gray-500">
              &copy; {new Date().getFullYear()} Amphelo. All rights reserved.
            </p>
          </div>

        </div>
      </div>
    </footer>
  )
}
