"use client";

import { useState } from "react";
import { Activity, ArrowLeft, Shield, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Checkout from "@/components/checkout";

export default function GetStartedPage() {
  const [showCheckout, setShowCheckout] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="py-4 sm:py-6 px-4 sm:px-6 border-b border-neutral-100">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 text-neutral-600 hover:text-neutral-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <span className="font-semibold text-neutral-900 text-sm sm:text-base">Amphelo Health</span>
          </div>
          <div className="w-12 sm:w-16" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="py-10 sm:py-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          {/* Title */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-neutral-900 mb-3 sm:mb-4">
              Get Started with Amphelo
            </h1>
            <p className="text-neutral-600 text-base sm:text-lg px-2">
              Join our early access program and take back control of your diabetes.
            </p>
          </div>

          {/* Service Guarantee Card */}
          <div className="bg-neutral-50 rounded-xl sm:rounded-2xl p-5 sm:p-8 mb-6 sm:mb-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              <h2 className="text-lg sm:text-xl font-semibold text-neutral-900">Our Service Guarantee</h2>
            </div>
            
            <ul className="space-y-3 sm:space-y-4">
              <li className="flex items-start gap-2.5 sm:gap-3">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 mt-0.5 shrink-0" />
                <span className="text-sm sm:text-base text-neutral-700">
                  <strong className="text-neutral-900">Persistent Care Coordinator</strong> — Amphelo gets after it and drives every task to completion. No more wondering if someone followed up.
                </span>
              </li>
              <li className="flex items-start gap-2.5 sm:gap-3">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 mt-0.5 shrink-0" />
                <span className="text-sm sm:text-base text-neutral-700">
                  <strong className="text-neutral-900">Reactive Issue Resolution</strong> — Need help? We fix problems in a pinch.
                </span>
              </li>
              <li className="flex items-start gap-2.5 sm:gap-3">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 mt-0.5 shrink-0" />
                <span className="text-sm sm:text-base text-neutral-700">
                  <strong className="text-neutral-900">Proactive Management</strong> — Never wait again for that pesky refill or prior authorization. We&apos;ll handle it in advance.
                </span>
              </li>
              <li className="flex items-start gap-2.5 sm:gap-3">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 mt-0.5 shrink-0" />
                <span className="text-sm sm:text-base text-neutral-700">
                  <strong className="text-neutral-900">Cancel Anytime</strong> — No long-term contracts or commitments.
                </span>
              </li>
            </ul>
          </div>

          {/* Pricing Card */}
          <div className="bg-white border border-neutral-200 rounded-xl sm:rounded-2xl p-5 sm:p-8 mb-6 sm:mb-8">
            {!showCheckout ? (
              <>
                <div className="text-center mb-4 sm:mb-6">
                  <p className="text-sm sm:text-base text-neutral-600 mb-2">Early Access Special Pricing</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl sm:text-4xl font-semibold text-neutral-900">$35</span>
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-500 mt-2">Billed monthly. Cancel anytime.</p>
                </div>

                <div className="border-t border-neutral-100 pt-4 sm:pt-6">
                  <p className="text-center text-sm sm:text-base text-neutral-600 mb-4 sm:mb-6 px-2">
                    Ready to let Amphelo handle the admin and let you focus on living?
                  </p>
                  <button
                    className="w-full bg-blue-600 text-white py-3 sm:py-4 rounded-full font-medium hover:bg-blue-700 transition-colors text-base sm:text-lg"
                    onClick={() => setShowCheckout(true)}
                  >
                    Start Now
                  </button>
                </div>
              </>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-semibold text-neutral-900">Complete Your Payment</h3>
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="text-sm text-neutral-500 hover:text-neutral-700"
                  >
                    Go back
                  </button>
                </div>
                <Checkout productId="amphelo-early-access" />
              </div>
            )}
          </div>

          {/* Contact */}
          <div className="text-center text-sm sm:text-base text-neutral-600">
            <p>
              Questions? Email{" "}
              <a href="mailto:audrey@amphelohealth.com" className="text-blue-600 hover:underline">
                audrey@amphelohealth.com
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
