'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Phone, ExternalLink } from 'lucide-react'
import Navigation from '@/components/Navigation'
import { getState } from '@/lib/storage'
import type { AppState } from '@/lib/types'

// Extract the chain name from a full pharmacy name
// e.g. "CVS Pharmacy" → "CVS Pharmacy", "Duane Reade" → "Duane Reade"
function extractChainName(name: string): string {
  // Keep as-is — chain name is the pharmacy name
  return name.trim()
}

// Build a Google Maps search URL for nearby locations of a chain
function nearbyMapsUrl(chainName: string, address?: string): string {
  const query = address
    ? `${chainName} near ${address}`
    : `${chainName} near me`
  return `https://www.google.com/maps/search/${encodeURIComponent(query)}`
}

// Build a Google Maps embed URL (legacy format, no API key required)
function mapsEmbedUrl(chainName: string, address?: string): string {
  const query = address
    ? `${chainName} near ${address}`
    : `${chainName} near me`
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`
}

function PharmacyMapContent() {
  const router = useRouter()
  const [state, setStateLocal] = useState<AppState | null>(null)

  useEffect(() => {
    const s = getState()
    if (!s.onboardingComplete) { router.replace('/onboarding'); return }
    setStateLocal(s)
  }, [router])

  if (!state) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
    </div>
  )

  const { profile, pharmacies } = state

  // Deduplicate chains in case patient has multiple locations of same chain
  const chains = Array.from(new Map(pharmacies.map(p => [extractChainName(p.name), p])).entries())

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navigation patientName={profile?.name} />
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-slate-100 px-8 py-7">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-slate-400" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Pharmacy Map</h1>
              <p className="text-sm text-slate-400 mt-0.5">Nearby locations for your pharmacy chains</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-7 space-y-10 max-w-4xl">
          {chains.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-500">No pharmacies on file</p>
              <p className="text-xs text-slate-400 mt-1">Add pharmacies in Settings to see nearby locations.</p>
            </div>
          ) : (
            chains.map(([chainName, savedPharmacy]) => (
              <section key={chainName}>
                {/* Chain header + saved location */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{chainName}</h2>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                      {savedPharmacy.address && (
                        <span className="flex items-center gap-1.5 text-sm text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {savedPharmacy.address}
                          <span className="ml-1 text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100 font-medium">Your location</span>
                        </span>
                      )}
                      {savedPharmacy.phone && (
                        <span className="flex items-center gap-1.5 text-sm text-slate-500">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {savedPharmacy.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <a
                    href={nearbyMapsUrl(chainName, savedPharmacy.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors shrink-0 shadow-sm shadow-blue-200"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open in Maps
                  </a>
                </div>

                {/* Embedded map */}
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                  <iframe
                    title={`Nearby ${chainName} locations`}
                    src={mapsEmbedUrl(chainName, savedPharmacy.address)}
                    width="100%"
                    height="420"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </section>
            ))
          )}
        </div>
      </main>
    </div>
  )
}

export default function PharmacyMapPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      </div>
    }>
      <PharmacyMapContent />
    </Suspense>
  )
}
