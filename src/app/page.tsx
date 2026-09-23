'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { QrCode, ShieldCheck, Zap, ArrowRight, BarChart3, Smartphone } from 'lucide-react';

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100/80 text-slate-900 flex flex-col justify-between relative overflow-hidden">
      {/* Decorative subtle background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-indigo-100/60 via-purple-100/30 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Navbar */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-600/20">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center">
              <span className="text-xl font-black tracking-tight text-slate-900">
                Event<span className="text-indigo-600">QR</span>
              </span>
              <span className="text-xs px-2.5 py-0.5 ml-2.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-bold">
                Enterprise
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {session ? (
              <div className="flex items-center space-x-3">
                <span className="text-xs text-slate-500 hidden sm:inline">
                  Logged in as <strong className="text-slate-800">{session.user?.name}</strong> ({(session.user as any)?.role})
                </span>
                {(session.user as any)?.role === 'ADMIN' ? (
                  <Link
                    href="/admin/dashboard"
                    className="inline-flex items-center px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm shadow-indigo-600/20"
                  >
                    Admin Panel
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Link>
                ) : (
                  <Link
                    href="/scanner"
                    className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm shadow-emerald-600/20"
                  >
                    Scanner
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Link>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm shadow-indigo-600/20"
              >
                Sign In
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold shadow-xs">
            <Zap className="w-3.5 h-3.5 text-indigo-600" />
            <span>High Concurrency Safe Architecture (MySQL + Prisma)</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-tight">
            Seamless Event Check-In <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
              & Item Redemption Tracking
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Mobile-first QR scanning, cryptographic UUID badge generation, instant check-in verification, and race-condition-proof item redemption with live aggregate analytics.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/admin/dashboard"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center space-x-2 transition transform hover:-translate-y-0.5"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Admin Dashboard</span>
            </Link>

            <Link
              href="/scanner"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-sm shadow-xs flex items-center justify-center space-x-2 transition transform hover:-translate-y-0.5"
            >
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>Staff QR Scanner</span>
            </Link>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 sm:mt-20">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300 transition group">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 border border-indigo-100 group-hover:scale-105 transition">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Cryptographic QR Badges</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Generate non-guessable random UUID tokens. Print badges directly with attendee credentials and high-resolution QR codes.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300 transition group">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100 group-hover:scale-105 transition">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Concurrency-Safe Guards</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Direct DB unique constraint insertions with P2002 conflict handling prevent double check-ins and duplicate item redemptions across concurrent scanners.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300 transition group">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 border border-purple-100 group-hover:scale-105 transition">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Real-Time Live Dashboard</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Auto-refreshing metrics, live attendance rates, per-item redemption percentages, and instant CSV export reports.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p>EventQR Event Management System &bull; MySQL &bull; Prisma &bull; Next.js 14 App Router</p>
      </footer>
    </div>
  );
}
