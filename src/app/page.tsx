'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { QrCode, ShieldCheck, Zap, Users, ArrowRight, CheckCircle2, BarChart3, Smartphone } from 'lucide-react';

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-indigo-300">
                EventQR
              </span>
              <span className="text-xs px-2 py-0.5 ml-2 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                Enterprise
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {session ? (
              <div className="flex items-center space-x-3">
                <span className="text-xs text-slate-400 hidden sm:inline">
                  Logged in as <strong className="text-white">{session.user?.name}</strong> ({(session.user as any)?.role})
                </span>
                {(session.user as any)?.role === 'ADMIN' ? (
                  <Link
                    href="/admin/dashboard"
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition shadow-sm"
                  >
                    Admin Panel
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Link>
                ) : (
                  <Link
                    href="/scanner"
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition shadow-sm"
                  >
                    Scanner
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Link>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition shadow-lg shadow-indigo-500/20"
              >
                Sign In
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>High Concurrency Safe Architecture (MySQL + Prisma)</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Seamless Event Check-In & <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              Item Redemption Tracking
            </span>
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Mobile-first QR scanning, cryptographic UUID badge generation, instant check-in verification, and race-condition-proof item redemption with live aggregate analytics.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/admin/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-base shadow-xl shadow-indigo-500/25 flex items-center justify-center space-x-2 transition transform hover:-translate-y-0.5"
            >
              <BarChart3 className="w-5 h-5" />
              <span>Admin Dashboard</span>
            </Link>

            <Link
              href="/scanner"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-slate-100 font-semibold text-base flex items-center justify-center space-x-2 transition transform hover:-translate-y-0.5"
            >
              <Smartphone className="w-5 h-5 text-emerald-400" />
              <span>Staff QR Scanner</span>
            </Link>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-500/20">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Cryptographic QR Badges</h3>
            <p className="text-sm text-slate-400">
              Generate non-guessable random UUID tokens. Print badges directly with attendee credentials and high-resolution QR codes.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Concurrency-Safe Guards</h3>
            <p className="text-sm text-slate-400">
              Direct DB unique constraint insertions with P2002 conflict handling prevent double check-ins and duplicate item redemptions across concurrent scanners.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 border border-purple-500/20">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Real-Time Live Dashboard</h3>
            <p className="text-sm text-slate-400">
              Auto-refreshing metrics, live attendance rates, per-item redemption percentages, and instant CSV export reports.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-400">
        <p>EventQR Event Management System &bull; MySQL &bull; Prisma &bull; Next.js 14 App Router</p>
      </footer>
    </div>
  );
}
