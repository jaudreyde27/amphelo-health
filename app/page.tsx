export default function Home() {
  return (
    <div className="bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <div className="text-xl md:text-2xl font-bold text-sky-400">Amphelo</div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/hero-new.mp4" type="video/mp4" />
        </video>

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0" style={{background: 'linear-gradient(to right, rgba(10,30,60,0.72) 0%, rgba(10,30,60,0.45) 60%, rgba(10,30,60,0.15) 100%)'}} />

        {/* Text content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 pt-28 pb-16 md:pt-40 md:pb-28 w-full">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight text-white mb-6 md:mb-8 drop-shadow-md">
              You deserve better, more informed<br />Type One Diabetes care.
            </h1>
            <p className="text-xl sm:text-2xl text-sky-300 font-semibold drop-shadow">
              Coming soon.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
