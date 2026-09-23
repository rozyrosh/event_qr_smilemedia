'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEvent } from '@/context/EventContext';
import { formatDateTime } from '@/lib/utils';
import {
  Users,
  Search,
  Plus,
  QrCode,
  Download,
  Printer,
  Trash2,
  Edit2,
  CheckCircle2,
  X,
  Ticket,
  Mail,
  Phone,
  Gift,
} from 'lucide-react';
import QRCode from 'qrcode';

interface Customer {
  id: string;
  eventId: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  ticketType?: string | null;
  qrToken: string;
  createdAt: string;
  attendance?: {
    id: string;
    scannedAt: string;
    scannedBy: string | null;
  } | null;
  redemptions: {
    id: string;
    redemptionItemId: string;
    redeemedAt: string;
    redeemedBy: string | null;
    redemptionItem: {
      name: string;
    };
  }[];
}

export default function CustomersManagementPage() {
  const { selectedEventId, selectedEvent } = useEvent();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [ticketFilter, setTicketFilter] = useState('ALL');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [badgeModalCustomer, setBadgeModalCustomer] = useState<Customer | null>(null);
  const [badgeQrDataUrl, setBadgeQrDataUrl] = useState<string>('');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [ticketType, setTicketType] = useState('General Admission');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    if (!selectedEventId) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        eventId: selectedEventId,
        search,
        ticketType: ticketFilter,
      });

      const res = await fetch(`/api/customers?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedEventId, search, ticketFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setTicketType('General Admission');
    setError(null);
    setCreateModalOpen(true);
  };

  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setFullName(cust.fullName);
    setEmail(cust.email || '');
    setPhone(cust.phone || '');
    setTicketType(cust.ticketType || 'General Admission');
    setError(null);
    setCreateModalOpen(true);
  };

  const openBadgeModal = async (cust: Customer) => {
    setBadgeModalCustomer(cust);
    try {
      const url = await QRCode.toDataURL(cust.qrToken, {
        width: 350,
        margin: 2,
        color: { dark: '#020617', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      });
      setBadgeQrDataUrl(url);
    } catch (err) {
      console.error('QR render error:', err);
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName) {
      setError('Full Name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers';
      const method = editingCustomer ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEventId,
          fullName,
          email,
          phone,
          ticketType,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save customer');
      }

      await fetchCustomers();
      setCreateModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Error saving attendee');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomer = async (id: string, name: string) => {
    if (!confirm(`Delete attendee "${name}"? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchCustomers();
      }
    } catch (err) {
      alert('Error deleting attendee');
    }
  };

  const downloadQRCode = (cust: Customer, dataUrl: string) => {
    const link = document.createElement('a');
    link.download = `${cust.fullName.replace(/\s+/g, '_')}_QR.png`;
    link.href = dataUrl;
    link.click();
  };

  const printBadge = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Customer Management
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Pre-registered customers, QR badge generation, check-in status, and item claims for{' '}
            <strong className="text-indigo-600 font-bold">{selectedEvent?.name}</strong>
          </p>
        </div>

        <button
          onClick={openCreateModal}
          disabled={!selectedEventId}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 transition disabled:opacity-50 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register Customer</span>
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, or QR token..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Ticket className="w-4 h-4 text-slate-400 hidden sm:inline" />
          <select
            value={ticketFilter}
            onChange={(e) => setTicketFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs"
          >
            <option value="ALL">All Ticket Types</option>
            <option value="VIP Pass">VIP Pass</option>
            <option value="General Admission">General Admission</option>
            <option value="Speaker">Speaker</option>
            <option value="Staff">Staff</option>
          </select>
        </div>
      </div>

      {/* Attendees Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider font-bold text-slate-600">
                <th className="py-4 px-6">Customer</th>
                <th className="py-4 px-6">Ticket Type</th>
                <th className="py-4 px-6">Attendance</th>
                <th className="py-4 px-6">Redemptions</th>
                <th className="py-4 px-6 text-right">QR & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 animate-pulse">
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-500">
                    <Users className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <p className="font-bold text-slate-800">No customers found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Register customers in advance to generate cryptographic QR badge codes.
                    </p>
                  </td>
                </tr>
              ) : (
                customers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{cust.fullName}</div>
                      <div className="text-xs text-slate-500 flex items-center space-x-3 mt-0.5">
                        {cust.email && (
                          <span className="flex items-center">
                            <Mail className="w-3 h-3 mr-1 text-slate-400" />
                            {cust.email}
                          </span>
                        )}
                        {cust.phone && (
                          <span className="flex items-center">
                            <Phone className="w-3 h-3 mr-1 text-slate-400" />
                            {cust.phone}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {cust.ticketType || 'General'}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      {cust.attendance ? (
                        <div>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Checked In
                          </span>
                          <div className="text-[11px] text-slate-500 mt-1">
                            {formatDateTime(cust.attendance.scannedAt)}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          Not Checked In
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      {cust.redemptions && cust.redemptions.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {cust.redemptions.map((r) => (
                            <span
                              key={r.id}
                              className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200"
                            >
                              <Gift className="w-3 h-3 mr-1 text-amber-600" />
                              {r.redemptionItem?.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 font-medium">0 claimed</span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openBadgeModal(cust)}
                          title="View QR Badge & Print"
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white text-xs font-semibold border border-indigo-200 hover:border-indigo-600 transition shadow-xs"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>QR Badge</span>
                        </button>
                        <button
                          onClick={() => openEditModal(cust)}
                          title="Edit"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(cust.id, cust.fullName)}
                          title="Delete"
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Badge View & Print Modal */}
      {badgeModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Attendee Badge & QR</h3>
              </div>
              <button
                onClick={() => setBadgeModalCustomer(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Badge Preview Card Container */}
            <div
              id="printable-badge"
              className="bg-white text-slate-900 rounded-2xl p-6 shadow-md border-2 border-indigo-600 flex flex-col items-center text-center space-y-4"
            >
              <div className="space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-600">
                  {selectedEvent?.name || 'EVENT BADGE'}
                </span>
                <h2 className="text-2xl font-black text-slate-950 tracking-tight">
                  {badgeModalCustomer.fullName}
                </h2>
                <div className="inline-block px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 font-bold text-xs uppercase tracking-wide">
                  {badgeModalCustomer.ticketType || 'General Admission'}
                </div>
              </div>

              {/* QR Image */}
              {badgeQrDataUrl && (
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={badgeQrDataUrl}
                    alt="Attendee QR"
                    className="w-48 h-48 object-contain"
                  />
                </div>
              )}

              <div className="text-[10px] font-mono text-slate-500 break-all max-w-[260px]">
                Token: {badgeModalCustomer.qrToken}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => downloadQRCode(badgeModalCustomer, badgeQrDataUrl)}
                className="flex-1 inline-flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-300 transition"
              >
                <Download className="w-4 h-4 text-indigo-600" />
                <span>Download PNG</span>
              </button>

              <button
                onClick={printBadge}
                className="flex-1 inline-flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print Badge</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Attendee Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">
                {editingCustomer ? 'Edit Customer' : 'Register New Customer'}
              </h2>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Sarah Connor"
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sarah@example.com"
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-1234"
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Ticket Type
                </label>
                <select
                  value={ticketType}
                  onChange={(e) => setTicketType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs"
                >
                  <option value="General Admission">General Admission</option>
                  <option value="VIP Pass">VIP Pass</option>
                  <option value="Speaker">Speaker</option>
                  <option value="Staff">Staff</option>
                  <option value="Media">Media / Press</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 transition disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>{editingCustomer ? 'Update Customer' : 'Register & Generate QR'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
