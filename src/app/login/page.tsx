'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { QrCode, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        router.refresh();
        if (email.toLowerCase().includes('admin')) {
          router.push('/admin/dashboard');
        } else {
          router.push('/scanner');
        }
      }
    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background soft glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-100/70 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-purple-100/60 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-md space-y-8 z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-lg shadow-indigo-600/25 mb-2">
            <QrCode className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            EventQR Portal
          </h1>
          <p className="text-sm text-slate-500">
            Sign in to access the event management or scanner dashboard
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-8 shadow-xl shadow-slate-200/50 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@eventqr.io"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-transparent transition shadow-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-transparent transition shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center space-x-2 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo Login Quick Fills */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <span className="text-xs font-semibold text-slate-500 block text-center">
              Quick One-Click Demo Credentials:
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@eventqr.io', 'admin123')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 text-left transition group cursor-pointer"
              >
                <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-700 group-hover:text-indigo-800">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Admin User</span>
                </div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">admin@eventqr.io</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('staff@eventqr.io', 'staff123')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-200 text-left transition group cursor-pointer"
              >
                <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700 group-hover:text-emerald-800">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Staff Scanner</span>
                </div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">staff@eventqr.io</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
