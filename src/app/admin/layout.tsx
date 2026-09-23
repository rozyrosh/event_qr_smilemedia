'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { EventProvider, useEvent } from '@/context/EventContext';
import {
  QrCode,
  LayoutDashboard,
  Calendar,
  Users,
  Gift,
  Smartphone,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Layers,
} from 'lucide-react';

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { events, selectedEventId, setSelectedEventId, selectedEvent } = useEvent();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Events', href: '/admin/events', icon: Calendar },
    { name: 'Customers', href: '/admin/customers', icon: Users },
    { name: 'Redemption Items', href: '/admin/items', icon: Gift },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row">
      {/* Mobile Top Nav */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-xs">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-base">EventQR Admin</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 transition"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 md:static md:translate-x-0 shadow-xs ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Brand */}
          <div className="p-6 border-b border-slate-200/80">
            <Link
              href="/admin/dashboard"
              className="flex items-center space-x-3 group"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900 tracking-tight">EventQR</span>
                <span className="block text-[11px] font-semibold text-indigo-600">Admin Control</span>
              </div>
            </Link>
          </div>

          {/* Event Switcher in Sidebar */}
          <div className="px-4 py-4 border-b border-slate-200 bg-slate-50/70">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
              <span>Active Event</span>
              <Layers className="w-3.5 h-3.5 text-slate-400" />
            </label>
            <div className="relative">
              <select
                value={selectedEventId || ''}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full appearance-none bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer pr-8 truncate shadow-xs"
              >
                {events.length === 0 ? (
                  <option value="">No events found</option>
                ) : (
                  events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            <div className="pt-4 mt-4 border-t border-slate-200">
              <Link
                href="/scanner"
                className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100/80 transition"
              >
                <Smartphone className="w-5 h-5 text-emerald-600" />
                <span>Launch QR Scanner</span>
              </Link>
            </div>
          </nav>

          {/* User Profile & Logout */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 truncate">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs">
                  {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {session?.user?.name || 'Administrator'}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {session?.user?.email || 'admin@eventqr.io'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                title="Sign Out"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white/80 border-b border-slate-200 backdrop-blur-md sticky top-0 z-30 shadow-xs">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Selected Event:
            </span>
            <span className="text-sm font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
              {selectedEvent ? selectedEvent.name : 'Loading events...'}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/scanner"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile Scanner Mode</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <EventProvider>
      <AdminShell>{children}</AdminShell>
    </EventProvider>
  );
}
