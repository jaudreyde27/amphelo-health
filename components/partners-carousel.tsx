'use client'

const PARTNERS = [
  { name: 'Omnipod / Insulet',  logo: '/logos/omnipod.png' },
  { name: 'Tandem',             logo: '/logos/tandem.png' },
  { name: 'Medtronic Diabetes', logo: '/logos/medtronic.png' },
  { name: 'Dexcom',             logo: '/logos/dexcom.png' },
  { name: 'FreeStyle Libre',    logo: '/logos/freestyle-libre.png' },
  { name: 'Eversense',          logo: '/logos/eversense.png' },
  { name: 'Walgreens',          logo: '/logos/walgreens.png' },
  { name: 'CVS Health',         logo: '/logos/cvs.png' },
]

export function PartnersCarousel() {
  return (
    <div className="w-full overflow-hidden py-4">
      <style>{`
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .partners-scroll {
          animation: scroll-left 14s linear infinite;
        }
        .partners-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="flex gap-8 partners-scroll">
        {[...PARTNERS, ...PARTNERS].map((partner, idx) => (
          <div
            key={idx}
            className="flex-shrink-0 w-48 bg-gray-50 rounded-xl px-5 py-4 flex flex-col items-center justify-center gap-2 h-24 hover:bg-gray-100 transition-colors"
          >
            <img
              src={partner.logo}
              alt={partner.name}
              className="max-h-20 max-w-44 w-full h-full object-contain"
              onError={(e) => {
                // fallback to text if logo fails to load
                const target = e.currentTarget
                target.style.display = 'none'
                const parent = target.parentElement
                if (parent) {
                  const span = parent.querySelector('span')
                  if (span) span.style.display = 'block'
                }
              }}
            />
            <span className="text-xs font-medium text-gray-600 text-center whitespace-nowrap hidden">
              {partner.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
