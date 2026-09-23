'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useEvent } from '@/context/EventContext';
import { formatDateTime } from '@/lib/utils';
import {
  Users,
  CheckCircle2,
  Percent,
  Gift,
  Download,
  Smartphone,
  RefreshCw,
  PlusCircle,
  Activity,
  Clock,
  UserCheck,
  ShieldAlert,
  ArrowUpRight,
} from 'lucide-react';

interface StatItem {
  id: string;
  name: string;
  maxPerCustomer: number;
  redeemedCount: number;
  redemptionRate: number;
}

interface ActivityItem {
  type: 'CHECK_IN' | 'REDEMPTION';
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
  staff: string;
}

interface DashboardStats {
  totalRegistered: number;
  totalCheckedIn: number;
  attendanceRate: number;
  items: StatItem[];
  activities: ActivityItem[];
  lastUpdated: string;
}

export default function AdminDashboardPage() {
  const { selectedEventId, selectedEvent, loading: eventLoading } = useEvent();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [liveMode, setLiveMode] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!selectedEventId) return;
    try {
      const res = await fetch(`/api/events/${selectedEventId}/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    }
  }, [selectedEventId]);

  useEffect(() => {
    if (selectedEventId) {
      setLoading(true);
      fetchStats().finally(() => setLoading(false));
    }
  }, [selectedEventId, fetchStats]);

  // Live polling every 5 seconds when liveMode is on
  useEffect(() => {
    if (!liveMode || !selectedEventId) return;
    const interval = setInterval(() => {
      fetchStats();
    }, 5000);
    return () => clearInterval(interval);
  }, [liveMode, selectedEventId, fetchStats]);

  const handleExportCSV = async () => {
    if (!selectedEventId) return;
    try {
      setExporting(true);
      window.location.href = `/api/events/${selectedEventId}/export`;
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setTimeout(() => setExporting(false), 2000);
    }
  };

  if (eventLoading || (!stats && loading)) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white border border-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!selectedEventId) {
    return (
      <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl p-8 shadow-xs">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">No Event Selected</h2>
        <p className="text-sm text-slate-500 mb-6">
          Please create an event or select one from the sidebar dropdown to view live metrics.
        </p>
        <Link
          href="/admin/events"
          className="inline-flex items-center px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition shadow-md shadow-indigo-600/20"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Create Event
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Event Live Analytics
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Real-time attendance check-in counter and item redemption metrics for{' '}
            <strong className="text-indigo-600 font-bold">{selectedEvent?.name}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Live Polling Toggle */}
          <button
            onClick={() => setLiveMode(!liveMode)}
            className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
              liveMode
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-white border-slate-300 text-slate-600 hover:text-slate-900'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                liveMode ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span>{liveMode ? 'Live Updates (5s)' : 'Live Paused'}</span>
          </button>

          {/* Manual Refresh */}
          <button
            onClick={() => fetchStats()}
            title="Refresh Data"
            className="p-2 rounded-xl bg-white border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* CSV Export Button */}
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold transition shadow-xs"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>{exporting ? 'Exporting...' : 'Export CSV Report'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Registered */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden group hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Registered
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900">
              {stats?.totalRegistered ?? 0}
            </div>
            <div className="text-xs text-slate-500 mt-1">Confirmed attendees in database</div>
          </div>
        </div>

        {/* Total Checked In */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden group hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Checked In
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-emerald-700">
              {stats?.totalCheckedIn ?? 0}
            </div>
            <div className="text-xs text-emerald-600 font-semibold mt-1">
              Active verified attendees
            </div>
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden group hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Turnout Rate
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900">
              {stats?.attendanceRate ?? 0}%
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${stats?.attendanceRate || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Total Redemptions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden group hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Redemption Items
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
              <Gift className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900">
              {stats?.items?.reduce((acc, i) => acc + i.redeemedCount, 0) ?? 0}
            </div>
            <div className="text-xs text-amber-600 font-semibold mt-1">
              Across {stats?.items?.length || 0} event items
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Item Progress + Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Item Redemption Progress (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Item Redemption Status</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track claimed vs pending items per attendee allocation
                </p>
              </div>
              <Link
                href="/admin/items"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center"
              >
                <span>Manage Items</span>
                <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>

            {stats?.items && stats.items.length > 0 ? (
              <div className="space-y-4">
                {stats.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Gift className="w-4 h-4 text-indigo-600" />
                        <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-700">
                        <span className="text-indigo-600 font-extrabold">{item.redeemedCount}</span> /{' '}
                        {stats.totalRegistered} claimed ({item.redemptionRate}%)
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-600 to-violet-600 h-2.5 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(item.redemptionRate, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500 text-sm">
                No redemption items created for this event yet.
              </div>
            )}
          </div>

          {/* Quick Action Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/admin/customers"
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 shadow-xs transition group"
            >
              <Users className="w-6 h-6 text-indigo-600 mb-2 group-hover:scale-110 transition transform" />
              <div className="font-bold text-slate-900 text-sm">Register & Manage Customers</div>
              <div className="text-xs text-slate-500 mt-1">
                Add attendees, view tokens, and print badges
              </div>
            </Link>

            <Link
              href="/scanner"
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 shadow-xs transition group"
            >
              <Smartphone className="w-6 h-6 text-emerald-600 mb-2 group-hover:scale-110 transition transform" />
              <div className="font-bold text-slate-900 text-sm">Open Scanner Interface</div>
              <div className="text-xs text-slate-500 mt-1">
                Verify badges and redeem items on mobile / camera
              </div>
            </Link>
          </div>
        </div>

        {/* Live Activity Stream (1 col) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">Live Activity Stream</h3>
            </div>
            <span className="text-[10px] text-slate-500">
              {stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleTimeString() : ''}
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[460px] pr-1">
            {stats?.activities && stats.activities.length > 0 ? (
              stats.activities.map((act) => (
                <div
                  key={`${act.type}-${act.id}`}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start space-x-3 text-xs"
                >
                  <div
                    className={`p-2 rounded-lg flex-shrink-0 mt-0.5 ${
                      act.type === 'CHECK_IN'
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                    }`}
                  >
                    {act.type === 'CHECK_IN' ? (
                      <UserCheck className="w-3.5 h-3.5" />
                    ) : (
                      <Gift className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 truncate">{act.title}</div>
                    <div className="text-[11px] text-slate-500 flex items-center justify-between mt-0.5">
                      <span>{act.subtitle}</span>
                      <span className="text-[10px] text-slate-400">by {act.staff}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDateTime(act.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                No check-ins or redemptions recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
