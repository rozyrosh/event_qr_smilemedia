'use client';

import { useState } from 'react';
import { useEvent } from '@/context/EventContext';
import { formatDate } from '@/lib/utils';
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  Edit2,
  Trash2,
  X,
  Gift,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export default function EventsManagementPage() {
  const { events, selectedEventId, setSelectedEventId, refreshEvents, loading } = useEvent();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingEvent(null);
    setName('');
    setDate(new Date().toISOString().split('T')[0]);
    setLocation('');
    setDescription('');
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (ev: any) => {
    setEditingEvent(ev);
    setName(ev.name);
    setDate(new Date(ev.date).toISOString().split('T')[0]);
    setLocation(ev.location || '');
    setDescription(ev.description || '');
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date) {
      setError('Name and Date are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const url = editingEvent ? `/api/events/${editingEvent.id}` : '/api/events';
      const method = editingEvent ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, date, location, description }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save event');
      }

      await refreshEvents();
      setModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Error saving event');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, eventName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${eventName}"? All attendees, QR badges, and redemption records for this event will be permanently deleted.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await refreshEvents();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete event');
      }
    } catch (err) {
      alert('Error deleting event');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Events Management
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Create and manage multiple events, configure items, and oversee attendee registrations
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Event</span>
        </button>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 bg-white border border-slate-200 rounded-3xl" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl p-8 shadow-xs">
          <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 mb-1">No Events Found</h3>
          <p className="text-sm text-slate-500 mb-6">
            Get started by creating your first event to register attendees and track redemptions.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Event</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((ev) => {
            const isSelected = ev.id === selectedEventId;
            return (
              <div
                key={ev.id}
                className={`p-6 rounded-3xl bg-white border transition flex flex-col justify-between relative group shadow-xs ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition">
                      {ev.name}
                    </h3>
                    {isSelected && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-bold border border-indigo-200">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-xs text-slate-500 mb-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{formatDate(ev.date)}</span>
                    </div>
                    {ev.location && (
                      <div className="flex items-center space-x-2 truncate">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span className="truncate">{ev.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 py-3 border-y border-slate-100 my-4 text-xs font-bold text-slate-700">
                    <div className="flex items-center space-x-1.5">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <span>{ev._count?.customers ?? 0} Attendees</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Gift className="w-4 h-4 text-amber-600" />
                      <span>{ev._count?.items ?? 0} Items</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditModal(ev)}
                      title="Edit Event"
                      className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ev.id, ev.name)}
                      title="Delete Event"
                      className="p-2 rounded-lg bg-slate-100 text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {!isSelected ? (
                    <button
                      onClick={() => setSelectedEventId(ev.id)}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-600 text-slate-700 hover:text-white text-xs font-semibold transition cursor-pointer"
                    >
                      <span>Select Event</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <Link
                      href="/admin/dashboard"
                      className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
                    >
                      <span>View Live</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
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

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Event Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. AI & Web Summit 2026"
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Grand Hall B"
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief overview of the event agenda and guests..."
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
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
                    <span>{editingEvent ? 'Update Event' : 'Create Event'}</span>
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
