"use client";

import { useState } from "react";
import { Activity, ArrowLeft, Shield, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Checkout from "@/components/checkout";

export default function MonthlyCheckoutPage() {
  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="py-4 sm:py-6 px-4 sm:px-6 border-b border-accent/20 sticky top-0 gradient-bg/95 backdrop-blur-sm z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 text-accent hover:text-accent/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>
          <span className="accent-text font-bold text-sm sm:text-base">Amphelo Health</span>
          <div className="w-12 sm:w-16" />
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
              Monthly plan - <span className="font-semibold text-neutral-900">$35/month</span>
            </p>
          </div>

          {/* Service Guarantee Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-8 mb-6 sm:mb-8 border-2 border-accent/20">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
              <h2 className="text-lg sm:text-xl font-semibold text-neutral-900">Our Service Guarantee</h2>
            </div>
            
            <ul className="space-y-3 sm:space-y-4">
              <li className="flex items-start gap-2.5 sm:gap-3">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 mt-0.5 shrink-0" />
                <span className="text-sm sm:text-base text-neutral-700">
                  <strong className="text-neutral-900">Persistent Care Coordinator</strong> — Amphelo gets after it and drives every task to completion.
                </span>
              </li>
              <li className="flex items-start gap-2.5 sm:gap-3">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 mt-0.5 shrink-0" />
                <span className="text-sm sm:text-base text-neutral-700">
                  <strong className="text-neutral-900">In-a-Pinch Support</strong> — Need help? We fix problems fast.
                </span>
              </li>
              <li className="flex items-start gap-2.5 sm:gap-3">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 mt-0.5 shrink-0" />
                <span className="text-sm sm:text-base text-neutral-700">
                  <strong className="text-neutral-900">Day-to-Day Management</strong> — Refills, authorizations, and appointments handled proactively.
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

          {/* Checkout Form */}
          <div className="bg-white border-2 border-accent/20 rounded-xl sm:rounded-2xl p-5 sm:p-8 mb-6 sm:mb-8">
            <div className="mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-neutral-900">Complete Your Payment</h3>
              <p className="text-xs sm:text-sm text-neutral-500 mt-2">Billed monthly. Cancel anytime.</p>
            </div>
            <Checkout productId="amphelo-monthly" />
          </div>

          {/* Alternative Option */}
          <div className="text-center mb-6">
            <p className="text-sm text-neutral-500 mb-2">Want to save 30%?</p>
            <Link href="/get-started/yearly" className="text-accent hover:underline text-sm font-medium">
              Switch to yearly plan - $294/year
            </Link>
          </div>

          {/* Contact */}
          <div className="text-center text-sm sm:text-base text-neutral-600">
            <p>
              Questions? Email{" "}
              <a href="mailto:audrey@amphelohealth.com" className="text-accent hover:underline">
                audrey@amphelohealth.com
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
