'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { formatDateTime } from '@/lib/utils';
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Gift,
  UserCheck,
  RefreshCw,
  LogOut,
  Camera,
  Search,
  ArrowLeft,
  Mail,
  Phone,
  Clock,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface VerifyData {
  found: boolean;
  customer: {
    id: string;
    fullName: string;
    email?: string | null;
    phone?: string | null;
    ticketType?: string | null;
    qrToken: string;
    createdAt: string;
  };
  event: {
    id: string;
    name: string;
    date: string;
    location?: string | null;
  };
  attendance: {
    isCheckedIn: boolean;
    scannedAt: string | null;
    scannedBy: string | null;
  };
  items: {
    id: string;
    name: string;
    maxPerCustomer: number;
    isRedeemed: boolean;
    redeemedAt: string | null;
    redeemedBy: string | null;
  }[];
}

export default function ScannerPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [manualToken, setManualToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyData, setVerifyData] = useState<VerifyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanCooldown, setScanCooldown] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Optimistic UI loading states for buttons
  const [checkingIn, setCheckingIn] = useState(false);
  const [redeemingItemId, setRedeemingItemId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  // Play audio beep on scan
  const playBeep = useCallback(
    (type: 'success' | 'warn' = 'success') => {
      if (!soundEnabled || typeof window === 'undefined') return;
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'success') {
          osc.frequency.setValueAtTime(800, audioCtx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
        } else {
          osc.frequency.setValueAtTime(400, audioCtx.currentTime);
          osc.frequency.setValueAtTime(300, audioCtx.currentTime + 0.15);
        }

        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      } catch (e) {
        // AudioContext not permitted without interaction
      }
    },
    [soundEnabled]
  );

  const verifyToken = async (token: string) => {
    if (!token || loading) return;
    setLoading(true);
    setError(null);
    setActionFeedback(null);

    try {
      const res = await fetch(`/api/customers/verify/${encodeURIComponent(token.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.found) {
        setError(data.error || 'Invalid QR code or Attendee not found');
        setVerifyData(null);
        playBeep('warn');
      } else {
        setVerifyData(data);
        playBeep('success');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify QR code');
      playBeep('warn');
    } finally {
      setLoading(false);
    }
  };

  // Debounced scan handler to prevent duplicate triggers
  const handleScan = (detectedCodes: any[]) => {
    if (scanCooldown || loading || !detectedCodes || detectedCodes.length === 0) return;

    const rawValue = detectedCodes[0]?.rawValue || detectedCodes[0]?.value;
    if (!rawValue) return;

    setScanCooldown(true);
    verifyToken(rawValue);

    // 2-second debounce cooldown
    setTimeout(() => {
      setScanCooldown(false);
    }, 2000);
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualToken.trim()) {
      verifyToken(manualToken.trim());
    }
  };

  // Check In Action with Concurrency-Safe Direct Insert & Optimistic UI
  const handleCheckIn = async () => {
    if (!verifyData || checkingIn) return;
    setCheckingIn(true);
    setActionFeedback(null);

    // Optimistic UI state
    const prevAttendance = { ...verifyData.attendance };
    setVerifyData((prev) =>
      prev
        ? {
            ...prev,
            attendance: {
              isCheckedIn: true,
              scannedAt: new Date().toISOString(),
              scannedBy: session?.user?.name || 'Staff',
            },
          }
        : null
    );

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: verifyData.customer.id,
          scannedBy: session?.user?.name || 'Staff Scanner',
        }),
      });

      const data = await res.json();

      if (res.status === 201) {
        playBeep('success');
        setActionFeedback({
          type: 'success',
          message: 'Attendance checked in successfully!',
        });
        if (data.attendance) {
          setVerifyData((prev) =>
            prev
              ? {
                  ...prev,
                  attendance: {
                    isCheckedIn: true,
                    scannedAt: data.attendance.scannedAt,
                    scannedBy: data.attendance.scannedBy,
                  },
                }
              : null
          );
        }
      } else if (res.status === 409) {
        // Concurrency Guard Caught: Already checked in
        playBeep('warn');
        setActionFeedback({
          type: 'warning',
          message: `Already checked in at ${formatDateTime(data.attendance?.scannedAt)} by ${
            data.attendance?.scannedBy || 'Staff'
          }`,
        });
        if (data.attendance) {
          setVerifyData((prev) =>
            prev
              ? {
                  ...prev,
                  attendance: {
                    isCheckedIn: true,
                    scannedAt: data.attendance.scannedAt,
                    scannedBy: data.attendance.scannedBy,
                  },
                }
              : null
          );
        }
      } else {
        throw new Error(data.error || 'Failed to check in');
      }
    } catch (err: any) {
      // Revert optimistic state on unexpected failure
      setVerifyData((prev) => (prev ? { ...prev, attendance: prevAttendance } : null));
      setActionFeedback({
        type: 'error',
        message: err.message || 'Check-in failed. Please retry.',
      });
      playBeep('warn');
    } finally {
      setCheckingIn(false);
    }
  };

  // Redeem Item Action with Concurrency-Safe Direct Insert & Optimistic UI
  const handleRedeemItem = async (itemId: string, itemName: string) => {
    if (!verifyData || redeemingItemId) return;
    setRedeemingItemId(itemId);
    setActionFeedback(null);

    // Optimistic UI state
    const prevItems = [...verifyData.items];
    setVerifyData((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((it) =>
              it.id === itemId
                ? {
                    ...it,
                    isRedeemed: true,
                    redeemedAt: new Date().toISOString(),
                    redeemedBy: session?.user?.name || 'Staff',
                  }
                : it
            ),
          }
        : null
    );

    try {
      const res = await fetch('/api/redemptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: verifyData.customer.id,
          redemptionItemId: itemId,
          redeemedBy: session?.user?.name || 'Staff Scanner',
        }),
      });

      const data = await res.json();

      if (res.status === 201) {
        playBeep('success');
        setActionFeedback({
          type: 'success',
          message: `${itemName} redeemed successfully!`,
        });
      } else if (res.status === 409) {
        // Concurrency Guard Caught: Already redeemed
        playBeep('warn');
        setActionFeedback({
          type: 'warning',
          message: `${itemName} was already redeemed at ${formatDateTime(
            data.redemption?.redeemedAt
          )} by ${data.redemption?.redeemedBy || 'Staff'}`,
        });
      } else {
        throw new Error(data.error || 'Failed to redeem item');
      }
    } catch (err: any) {
      // Revert optimistic state on failure
      setVerifyData((prev) => (prev ? { ...prev, items: prevItems } : null));
      setActionFeedback({
        type: 'error',
        message: err.message || 'Redemption failed. Please retry.',
      });
      playBeep('warn');
    } finally {
      setRedeemingItemId(null);
    }
  };

  const handleResetScan = () => {
    setVerifyData(null);
    setError(null);
    setActionFeedback(null);
    setManualToken('');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col justify-between">
      {/* Top Header Bar */}
      <header className="border-b border-slate-200 bg-white shadow-xs px-4 py-3 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {(session?.user as any)?.role === 'ADMIN' ? (
            <Link
              href="/admin/dashboard"
              className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition"
              title="Return to Admin Panel"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-xs">
              <QrCode className="w-5 h-5 text-white" />
            </div>
          )}

          <div>
            <h1 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <span>QR Scanner</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Staff Mode
              </span>
            </h1>
            <p className="text-[11px] text-slate-500">
              Logged in: <strong className="text-slate-800">{session?.user?.name || 'Staff'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Audio toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition ${
              soundEnabled
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-slate-100 text-slate-400 border-slate-200'
            }`}
            title={soundEnabled ? 'Mute Sounds' : 'Enable Sounds'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Sign Out */}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition border border-slate-200"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Scanner Body */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 flex flex-col justify-start space-y-4">
        {/* Toggle Mode: Camera vs Manual Input */}
        <div className="grid grid-cols-2 p-1 bg-slate-200/80 border border-slate-300 rounded-2xl shadow-xs">
          <button
            onClick={() => {
              setActiveTab('camera');
              setCameraActive(true);
            }}
            className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition ${
              activeTab === 'camera'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4 text-indigo-600" />
            <span>Camera Scanner</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('manual');
              setCameraActive(false);
            }}
            className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition ${
              activeTab === 'manual'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="w-4 h-4 text-indigo-600" />
            <span>Manual Lookup</span>
          </button>
        </div>

        {/* Camera Viewfinder (Only when no attendee card is active or tab is camera) */}
        {!verifyData && activeTab === 'camera' && (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-md relative flex flex-col items-center">
            <div className="w-full aspect-square max-h-[360px] relative overflow-hidden bg-black flex items-center justify-center">
              {cameraActive ? (
                <Scanner
                  onScan={handleScan}
                  allowMultiple={true}
                  scanDelay={1000}
                  styles={{
                    container: { width: '100%', height: '100%' },
                    video: { objectFit: 'cover' },
                  }}
                />
              ) : (
                <div className="text-slate-400 text-xs">Camera paused</div>
              )}

              {/* Viewfinder Target Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-56 h-56 border-2 border-indigo-400/80 rounded-2xl relative shadow-[0_0_25px_rgba(99,102,241,0.3)]">
                  {/* Corner accents */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-indigo-500 rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-indigo-500 rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-indigo-500 rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-indigo-500 rounded-br-lg" />

                  {/* Animated laser line */}
                  <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent scanner-laser" />
                </div>
              </div>

              {loading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center space-x-2 text-white text-sm font-semibold">
                  <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  <span>Decoding badge...</span>
                </div>
              )}
            </div>

            <div className="p-3.5 text-center text-xs text-slate-500 font-medium">
              Align attendee QR code inside the viewfinder box
            </div>
          </div>
        )}

        {/* Manual Input Tab */}
        {!verifyData && activeTab === 'manual' && (
          <form
            onSubmit={handleManualSearch}
            className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Enter QR Token / UUID
              </label>
              <input
                type="text"
                required
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="e.g. 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono shadow-xs"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !manualToken.trim()}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Lookup Attendee</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Error message */}
        {error && !verifyData && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start space-x-3 animate-in fade-in shadow-xs">
            <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold">Verification Failed</div>
              <div className="text-xs text-rose-700 mt-0.5">{error}</div>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-slate-400 hover:text-slate-700 text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Attendee Verification Result Card */}
        {verifyData && (
          <div className="space-y-4 animate-in slide-in-from-bottom-3 duration-200">
            {/* Top Action Feedback Banner */}
            {actionFeedback && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center space-x-2.5 border shadow-xs ${
                  actionFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : actionFeedback.type === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {actionFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                )}
                <span>{actionFeedback.message}</span>
              </div>
            )}

            {/* Profile Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md relative overflow-hidden space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">
                    {verifyData.event.name}
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                    {verifyData.customer.fullName}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    {verifyData.customer.email && (
                      <span className="flex items-center">
                        <Mail className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {verifyData.customer.email}
                      </span>
                    )}
                    {verifyData.customer.phone && (
                      <span className="flex items-center">
                        <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {verifyData.customer.phone}
                      </span>
                    )}
                  </div>
                </div>

                <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold">
                  {verifyData.customer.ticketType || 'General'}
                </div>
              </div>

              {/* Attendance Action Section */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Attendance Check-In
                    </span>
                  </div>

                  {verifyData.attendance.isCheckedIn ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Checked In
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-500">Pending</span>
                  )}
                </div>

                {verifyData.attendance.isCheckedIn ? (
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 flex items-center justify-between shadow-xs">
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDateTime(verifyData.attendance.scannedAt)}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      by {verifyData.attendance.scannedBy || 'Staff'}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={handleCheckIn}
                    disabled={checkingIn}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    {checkingIn ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm Check-In</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Redemption Items Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Gift className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Item Redemptions
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {verifyData.items.filter((i) => i.isRedeemed).length} /{' '}
                    {verifyData.items.length} Claimed
                  </span>
                </div>

                {verifyData.items.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                    No redemption items configured for this event.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {verifyData.items.map((item) => {
                      const isProcessing = redeemingItemId === item.id;
                      return (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-slate-900 text-sm truncate">
                              {item.name}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {item.isRedeemed ? (
                                <span className="text-emerald-700 font-semibold">
                                  Redeemed {item.redeemedAt ? new Date(item.redeemedAt).toLocaleTimeString() : ''}{' '}
                                  by {item.redeemedBy || 'Staff'}
                                </span>
                              ) : (
                                <span>Max {item.maxPerCustomer} claim per attendee</span>
                              )}
                            </div>
                          </div>

                          {item.isRedeemed ? (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex-shrink-0">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Redeemed
                            </span>
                          ) : (
                            <button
                              onClick={() => handleRedeemItem(item.id, item.name)}
                              disabled={isProcessing}
                              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center space-x-1.5 flex-shrink-0 cursor-pointer"
                            >
                              {isProcessing ? (
                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Gift className="w-3.5 h-3.5" />
                                  <span>Redeem</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Scan Next Attendee Button */}
            <button
              onClick={handleResetScan}
              className="w-full py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 shadow-sm transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-indigo-600" />
              <span>Scan Next Attendee</span>
            </button>
          </div>
        )}
      </main>

      {/* Footer info */}
      <footer className="p-3 text-center text-[11px] text-slate-500">
        Connected to EventQR &bull; Concurrency Protected (DB Unique Constraints)
      </footer>
    </div>
  );
}
