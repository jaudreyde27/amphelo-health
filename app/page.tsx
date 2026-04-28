import Link from 'next/link'
import { IntakeAnimation, ChatAnimation, DashboardAnimation, PhoneCallAnimation, OutreachAnimation } from '@/components/animations'
import { HeroHeadline } from '@/components/hero-headline'
import { PartnersCarousel } from '@/components/partners-carousel'
import { Footer } from '@/components/footer'

export default function Home() {
  return (
    <div className="bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <div className="text-xl md:text-2xl font-bold text-sky-400">Amphelo</div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#capabilities" className="text-sm font-medium text-gray-700 hover:text-black">Capabilities</a>
            <a href="#integrations" className="text-sm font-medium text-gray-700 hover:text-black">Integrations</a>
            <a href="#pricing" className="text-sm font-medium text-gray-700 hover:text-black">Pricing</a>
            <Link href="/free-trial" className="cta-button text-sm">Sign up</Link>
          </div>
          <Link href="/free-trial" className="md:hidden cta-button text-xs px-3 py-2">Sign up</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/images/hero-family.jpg"
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0" style={{background: 'linear-gradient(to right, rgba(10,30,60,0.72) 0%, rgba(10,30,60,0.45) 60%, rgba(10,30,60,0.15) 100%)'}} />

        {/* Text content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 pt-28 pb-16 md:pt-40 md:pb-28 w-full">
          <div className="max-w-2xl">
            <div className="tagline mb-4 md:mb-6 text-sky-300 tracking-widest text-xs sm:text-sm leading-relaxed">YOUR T1D CARE COORDINATOR. FOR PARENTS AND ADULTS WITH T1D.</div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl font-bold leading-tight text-white mb-6 md:mb-8 drop-shadow-md">
              <HeroHeadline />
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-xl mb-8 md:mb-10 leading-relaxed drop-shadow">
              Amphelo gives you back control.
              <br />
              A powerful, personalized care coordinator, always in your corner.
            </p>
            <Link href="/free-trial" className="cta-button inline-block">
              Sign up for our waitlist now
            </Link>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="px-4 md:px-6 py-16 md:py-24 lg:py-32 warm-section">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 md:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2 md:mb-4">
              Two groundbreaking products.<br />Each designed to give you back time.
            </h2>
          </div>

          {/* Amphelo Core */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 mb-16 md:mb-24 items-center">
            <div className="order-2 md:order-1 w-full overflow-hidden">
              <ChatAnimation />
            </div>
            <div className="order-1 md:order-2 min-w-0">
              <p className="text-sm text-gray-500 mb-3 italic">Our most streamlined offer. Get help, but only what you need.</p>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-sky-400 mb-4 md:mb-6">Amphelo Core</div>
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-6">
                Need help in a pinch? Amphelo&apos;s got you covered. <strong className="text-gray-900">Our care coordinator is ready to help you, 24/7/365.</strong>
              </p>
              <div className="flex flex-wrap gap-2 mt-6 mb-6">
                {['Vacation overrides', 'Last minute refills', 'Device replacements', 'Bridge prescriptions', 'Appointment changes', 'And more'].map((item) => (
                  <span key={item} className="px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-sm font-medium">
                    {item}
                  </span>
                ))}
              </div>
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed mt-6">
                Just start a chat, and Amphelo gets to work.
              </p>
            </div>
          </div>

          {/* Amphelo Plus */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="min-w-0">
              <p className="text-sm text-gray-500 mb-3 italic">Our full suite. Comprehensive care coordination, in one place.</p>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 md:mb-6" style={{color: '#a08a3a'}}>Amphelo Plus</div>
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-6">
                Manage day-to-day care, no more roadbumps. <strong className="text-gray-900">Never wait again, Amphelo handles it all in advance.</strong>
              </p>
              <ul className="space-y-3">
                {[
                  'All features in Amphelo Core, plus:',
                  'Live dashboard monitoring all prescriptions & appointments',
                  'Proactive management of refills and prior authorizations',
                  'Trusted, vetted doctor recommendations',
                  'And much, much more',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-base sm:text-lg text-gray-600">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{backgroundColor: '#a08a3a'}} />
                    <span className={i === 0 ? 'font-semibold text-gray-900' : ''}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="w-full overflow-hidden">
              <DashboardAnimation />
            </div>
          </div>

        </div>
      </section>

      {/* Section divider */}
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <hr className="border-gray-200" />
      </div>

      {/* Capabilities Section */}
      <section id="capabilities" className="px-4 md:px-6 pt-6 pb-16 md:pt-8 md:pb-24 lg:pb-32 warm-section">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 md:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2 md:mb-4">How we make it happen</h2>
          </div>

          {/* Capability 01 */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 mb-16 md:mb-24 items-center">
            <div className="min-w-0">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-sky-400 mb-3 md:mb-4">01</div>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 md:mb-6">
                Your care network, front and center.
              </h3>
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                Our smart intake process asks questions about you or your kid&apos;s care, learning the workflows you have to shoulder on your own today.
              </p>
            </div>
            <div className="w-full overflow-hidden">
              <IntakeAnimation />
            </div>
          </div>

          {/* Capability 02 */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 mb-16 md:mb-24 items-center">
            <div className="order-2 md:order-1 w-full overflow-hidden">
              <OutreachAnimation />
            </div>
            <div className="order-1 md:order-2 min-w-0">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-sky-400 mb-3 md:mb-4">02</div>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 md:mb-6">
                Amphelo reaches out for you, before and when you need it.
              </h3>
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                Amphelo uses tech integrations and voice calling to do the tasks you used to do on your own.
              </p>
            </div>
          </div>

          {/* Capability 03 (formerly 04) */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="min-w-0">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-sky-400 mb-3 md:mb-4">03</div>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 md:mb-6">
                Perseverance, where it matters.
              </h3>
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                When your Amphelo Care Coordinator can&apos;t get through, don&apos;t worry. <strong className="text-gray-900">We will have a member of our staff personally call and make sure your issue is resolved.</strong>
              </p>
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed mt-4">
                Put your feet up, Amphelo&apos;s got this.
              </p>
            </div>
            <div className="w-full overflow-hidden">
              <PhoneCallAnimation />
            </div>
          </div>

        </div>
      </section>

      {/* Integrations Section */}
      <section id="integrations" className="px-4 md:px-6 pt-8 pb-3 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2 text-center">Trusted Network</h2>
          <p className="text-base sm:text-lg font-semibold text-gray-700 text-center mb-2 max-w-2xl mx-auto">
            Works with the devices and pharmacies you already use.
          </p>
          <p className="text-base sm:text-lg text-gray-600 text-center mb-8 md:mb-12 max-w-2xl mx-auto">
            Amphelo integrates seamlessly with major diabetes device manufacturers and pharmacy chains across the country.
          </p>
          <PartnersCarousel />
        </div>
      </section>

      {/* HIPAA Bar */}
      <div className="border-t border-b border-gray-200 bg-gray-100 py-7 md:py-9 px-4 md:px-6 text-center">
        <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-700 tracking-tight">HIPAA compliant. We put privacy first.</p>
      </div>

      {/* Pricing Section */}
      <section id="pricing" className="px-4 md:px-6 pt-8 pb-16 md:pt-10 md:pb-24 warm-section">
        <div className="max-w-5xl mx-auto">
          {/* Video above pricing */}
          <div className="rounded-3xl overflow-hidden shadow-md mb-12 md:mb-16">
            <video
              autoPlay
              muted
              loop
              playsInline
              poster="/images/family-relaxed.jpg"
              className="w-full h-52 md:h-72 object-cover object-center"
            >
              <source src="/videos/pricing.mp4" type="video/mp4" />
            </video>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-10 md:mb-14">Great Care. Two Plans.</h2>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {/* Amphelo Core */}
            <div className="bg-white rounded-2xl border-2 border-blue-400 shadow-md p-5 sm:p-8 md:p-10 flex flex-col">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-sky-400 mb-3">Amphelo Core</h3>
              <p className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-4">In-a-pinch requests. Easy chat interface. Only when you need it.</p>
              <p className="text-sm font-semibold text-sky-400 mb-5">With a single chat request, you can:</p>

              {/* Checklist */}
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-start gap-2 text-sm sm:text-base text-gray-900">
                  <span className="text-sky-400 font-bold flex-shrink-0">+</span>
                  <span>Get vacation overrides and replacement insulin</span>
                </li>
                <li className="flex items-start gap-2 text-sm sm:text-base text-gray-900">
                  <span className="text-sky-400 font-bold flex-shrink-0">+</span>
                  <span>Request replacement CGMs and insulin pump supplies</span>
                </li>
                <li className="flex items-start gap-2 text-sm sm:text-base text-gray-900">
                  <span className="text-sky-400 font-bold flex-shrink-0">+</span>
                  <span>Change your tough-to-manage appointments</span>
                </li>
                <li className="flex items-start gap-2 text-sm sm:text-base text-gray-900">
                  <span className="text-sky-400 font-bold flex-shrink-0">+</span>
                  <span>Manage refills/prior authorizations when issues arise</span>
                </li>
                <li className="flex items-start gap-2 text-sm sm:text-base text-gray-900">
                  <span className="text-sky-400 font-bold flex-shrink-0">+</span>
                  <span>And more!</span>
                </li>
              </ul>

              <p className="text-base sm:text-lg text-gray-900 font-semibold mb-6">$8/request. No strings attached.</p>
              <Link href="/free-trial" className="cta-button inline-block text-center w-full">
                Sign up for our waitlist now
              </Link>
            </div>

            {/* Amphelo Plus */}
            <div className="rounded-2xl border-2 shadow-lg p-5 sm:p-8 md:p-10 flex flex-col" style={{background: 'linear-gradient(145deg, #fffdf5 0%, #fdf6e3 40%, #f0f7ff 100%)', borderColor: '#b8a96a'}}>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3" style={{color: '#a08a3a'}}>Amphelo Plus</h3>
              <p className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-4">Proactive management. 360-degree view. No more bumps in the road.</p>
              <p className="text-sm font-semibold mb-5" style={{color: '#7ab3d4'}}>All features in Amphelo Core, plus:</p>

              {/* Checklist */}
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-start gap-2 text-base text-gray-900">
                  <span className="font-bold flex-shrink-0" style={{color: '#b8a96a'}}>+</span>
                  <span>360 Degree View: Live dashboard monitoring all prescriptions, appointments and more</span>
                </li>
                <li className="flex items-start gap-2 text-base text-gray-900">
                  <span className="font-bold flex-shrink-0" style={{color: '#b8a96a'}}>+</span>
                  <span>Proactive management: Amphelo confirms all refills and clears prior auths in advance.</span>
                </li>
                <li className="flex items-start gap-2 text-base text-gray-900">
                  <span className="font-bold flex-shrink-0" style={{color: '#b8a96a'}}>+</span>
                  <span>Care Near Me: Find care nearby through trusted recommendations. Endocrinologists and GPs who really understand T1D.</span>
                </li>
                <li className="flex items-start gap-2 text-base text-gray-900">
                  <span className="font-bold flex-shrink-0" style={{color: '#b8a96a'}}>+</span>
                  <span>And more!</span>
                </li>
              </ul>

              <p className="text-base sm:text-lg font-semibold mb-6" style={{color: '#7a6830'}}>$35/month. No strings attached.</p>
              <Link href="/free-trial" className="inline-block text-center w-full py-3 px-8 rounded-2xl font-semibold transition-all shadow-sm hover:shadow-md" style={{background: 'linear-gradient(135deg, #c9a84c 0%, #e8d48a 50%, #c9a84c 100%)', color: '#3d2e00'}}>
                Sign up for our waitlist now
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
