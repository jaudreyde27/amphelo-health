"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Syringe, Cpu, MapPin, ShieldCheck, Stethoscope, MoreHorizontal, RefreshCw, FileCheck, Calendar } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

function ProcessStep({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex-1 text-center">
      <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-accent text-white font-semibold text-lg mb-3">
        {number}
      </div>
      <h4 className="font-semibold text-neutral-900 text-sm sm:text-base mb-2">{title}</h4>
      <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">{description}</p>
    </div>
  );
}

function AdHocRequestsAnimation() {
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [isAnimating, setIsAnimating] = useState(true);

  const messages = [
    { type: "user", text: "I'm traveling to Atlanta, Georgia and I left my Humalog pen at home. I need a replacement. My zipcode is 30309." },
    { type: "assistant", text: "I'm on it. Your closest Walgreens is at 1180 Peachtree St NE, Atlanta, GA 30309. Hours are 8:00 AM – 10:00 PM." },
    { type: "assistant", text: "I'm calling them now to see whether they have your insulin in stock and whether we can get you a vacation override." },
    { type: "status", text: "📞 Initiating call to Walgreens...", status: "initiating" },
    { type: "status", text: "📞 Call in progress", status: "progress" },
    { type: "assistant", text: "Call completed. Walgreens confirmed they can process a vacation override. Your Humalog refill is now processing and will be ready for pickup in approximately 30 minutes." },
    { type: "status", text: "✓ Vacation override approved", status: "success" }
  ];

  useEffect(() => {
    if (!isAnimating) return;

    const showMessages = async () => {
      for (let i = 0; i < messages.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1200));
        setVisibleMessages(prev => [...prev, i]);
      }
      // Reset after all messages shown and repeat
      await new Promise(resolve => setTimeout(resolve, 2000));
      setVisibleMessages([]);
    };

    const interval = setInterval(() => {
      showMessages();
    }, (messages.length * 1200) + 2000);

    showMessages();
    return () => clearInterval(interval);
  }, [isAnimating, messages.length]);

  return (
    <div className="mt-12 p-4 sm:p-6 rounded-2xl border-2 border-accent/20 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-neutral-900 text-base sm:text-lg">Ad Hoc Requests</h3>
        <span className="inline-block px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded">Coordinator ready</span>
      </div>
      
      <div className="space-y-3 min-h-[250px] sm:min-h-[300px] lg:min-h-[350px]">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`transform transition-all duration-500 ${
              visibleMessages.includes(index)
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            {message.type === "user" ? (
              <div className="flex justify-end">
                <div className="max-w-xs rounded-3xl rounded-tr-md bg-accent text-white text-sm px-4 py-3 shadow-md">
                  {message.text}
                </div>
              </div>
            ) : message.type === "status" ? (
              <div className={`flex items-center gap-2 p-3 rounded-2xl text-xs font-semibold w-fit ${
                message.status === "success"
                  ? "bg-emerald-100 text-emerald-700"
                  : message.status === "progress"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-blue-100 text-blue-700"
              }`}>
                <span>{message.text}</span>
              </div>
            ) : (
              <div className="flex justify-start">
                <div className="max-w-xs rounded-3xl rounded-tl-md bg-neutral-100 text-neutral-900 text-sm px-4 py-3 shadow-sm">
                  {message.text}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureBox({ icon: Icon, title, description, color = "blue" }: { icon: React.ElementType; title: string; description: string; color?: "blue" | "amber" | "emerald" | "purple" }) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200",
    amber: "bg-amber-50 border-amber-200",
    emerald: "bg-emerald-50 border-emerald-200",
    purple: "bg-purple-50 border-purple-200",
  };
  const iconColors = {
    blue: "text-blue-600",
    amber: "text-amber-600",
    emerald: "text-emerald-600",
    purple: "text-purple-600",
  };
  
  return (
    <div className={`p-4 sm:p-5 rounded-xl border-2 ${colorClasses[color]}`}>
      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColors[color]} mb-3`} />
      <h4 className="font-semibold text-neutral-900 text-sm sm:text-base mb-1">{title}</h4>
      <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">{description}</p>
    </div>
  );
}

export default function ForT1DsPage() {
  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {/* Header */}
      <header className="py-4 sm:py-6 px-4 sm:px-6 border-b border-accent/20 sticky top-0 gradient-bg/95 backdrop-blur-sm z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 text-accent hover:text-accent/80 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>
          <span className="accent-text font-bold text-sm sm:text-base">Amphelo Health</span>
          <div className="w-12 sm:w-16" />
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-10 sm:py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-neutral-900 mb-6 leading-tight">
            Hey there,
          </h1>
          <div className="space-y-4 text-lg sm:text-xl text-neutral-700 leading-relaxed">
            <p>
              We have Type One, too.
              <br />
              We get it. Sometimes it&apos;s too much.
            </p>
            <p>
              That&apos;s why we made Amphelo.
            </p>
            <p>
              Amphelo is your smart partner that helps take T1D admin tasks off your plate.
            </p>
            
            <div className="pt-6">
              <Link
                href="/free-trial"
                className="inline-block bg-accent text-white px-8 sm:px-12 py-3 sm:py-4 rounded-lg font-semibold hover:bg-accent/90 transition-colors text-base sm:text-lg"
              >
                Sign up for our waitlist now
              </Link>
            </div>

            <p className="font-semibold text-neutral-900">
              Here&apos;s what we do:
            </p>
          </div>
        </div>
      </section>

      {/* In a Pinch Section */}
      <section className="py-10 sm:py-16 px-4 sm:px-6 bg-neutral-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-neutral-900 mb-2">
            In a pinch?
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 mb-8">
            Amphelo will:
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureBox 
              icon={Syringe}
              title="Replace insulin"
              description="We handle the calls and coordination to get you replacement insulin fast."
              color="amber"
            />
            <FeatureBox 
              icon={Cpu}
              title="Find prescription"
              description="Emergency bridge prescriptions when you need them most."
              color="amber"
            />
            <FeatureBox 
              icon={Cpu}
              title="Replace devices"
              description="Quick replacement coordination with device manufacturers."
              color="amber"
            />
            <FeatureBox 
              icon={MapPin}
              title="Find pharmacy"
              description="We locate pharmacies nearby that have what you need."
              color="amber"
            />
            <FeatureBox 
              icon={ShieldCheck}
              title="Navigate overrides"
              description="We work with your insurance to get emergency overrides approved."
              color="amber"
            />
            <FeatureBox 
              icon={Stethoscope}
              title="Find doctor"
              description="When your regular doctor isn't available, we find alternatives."
              color="amber"
            />
          </div>
          <div className="mt-4 text-center">
            <span className="inline-flex items-center gap-2 text-neutral-600 text-base font-semibold">
              <MoreHorizontal className="w-5 h-5" />
              And more
            </span>
          </div>
        </div>
      </section>

      {/* Day-to-Day Section */}
      <section className="py-10 sm:py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-neutral-900 mb-2">
            Need help with the day-to-day?
          </h2>
          <p className="text-base sm:text-lg text-neutral-600 mb-8">
            Amphelo will:
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureBox 
              icon={RefreshCw}
              title="Make sure refills are ready"
              description="When and where you expect it — no more surprise stockouts."
              color="emerald"
            />
            <FeatureBox 
              icon={FileCheck}
              title="Make sure prior authorizations are clear"
              description="And refills replenished — before it becomes a problem."
              color="emerald"
            />
            <FeatureBox 
              icon={Calendar}
              title="Make sure appointments are scheduled"
              description="And re-scheduled per your schedule — we handle the coordination."
              color="emerald"
            />
          </div>
        </div>
      </section>

      {/* Image Break Section */}
      <section className="relative h-64 sm:h-80 md:h-96">
        <Image
          src="/images/t1d-athletes.jpg"
          alt="Athletes with Type 1 Diabetes living active lives"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-white text-center px-4">
            Letting You Live is Our Why.
          </h2>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-10 sm:py-16 px-4 sm:px-6 bg-neutral-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-neutral-900 mb-10 text-center">
            How does Amphelo work?
          </h2>
          
          {/* Process Flow */}
          <div className="flex flex-col sm:flex-row items-stretch gap-4 sm:gap-0">
            <ProcessStep 
              number="1"
              title="Smart Intake"
              description="Amphelo Smart Intake asks about your medical history, prescriptions, devices, and general care flows."
            />
            
            {/* Arrow */}
            <div className="hidden sm:flex items-center justify-center px-4">
              <ArrowRight className="w-6 h-6 text-neutral-400" />
            </div>
            <div className="sm:hidden flex justify-center">
              <div className="w-px h-8 bg-neutral-300" />
            </div>
            
            <ProcessStep 
              number="2"
              title="In-a-Pinch Requests — Handled"
              description="Your care coordinator is at the ready, 24/7. Amphelo makes calls and gets you what you need, fast."
            />
            
            {/* Arrow */}
            <div className="hidden sm:flex items-center justify-center px-4">
              <ArrowRight className="w-6 h-6 text-neutral-400" />
            </div>
            <div className="sm:hidden flex justify-center">
              <div className="w-px h-8 bg-neutral-300" />
            </div>
            
            <ProcessStep 
              number="3"
              title="Day-to-Day Flow — Kept Moving"
              description="On-time care, never worry again. Amphelo keeps things moving so you can focus on living your life."
            />
          </div>

          {/* Combined Animation Demo */}
          <AdHocRequestsAnimation />

          {/* Founder Band */}
          <div className="mt-12 py-8 px-4 sm:px-6 bg-accent/10 rounded-xl text-center">
            <p className="font-semibold text-neutral-900 text-lg sm:text-2xl md:text-3xl">
              For T1D, by T1Ds.
            </p>
            <p className="font-semibold text-neutral-900 text-lg sm:text-2xl md:text-3xl">
              Founded in Stanford, California
            </p>
          </div>

          {/* CTA Button */}
          <div className="mt-12 text-center">
            <Link
              href="/free-trial"
              className="inline-block bg-accent text-white px-8 sm:px-12 py-4 sm:py-5 rounded-lg font-semibold hover:bg-accent/90 transition-colors text-base sm:text-lg"
            >
              Sign up for our waitlist now
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 sm:px-6 border-t border-accent/20">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-neutral-600">
            Questions? Email{" "}
            <a href="mailto:audrey@amphelohealth.com" className="text-accent hover:underline font-medium">
              audrey@amphelohealth.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
