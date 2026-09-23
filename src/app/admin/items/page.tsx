'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEvent } from '@/context/EventContext';
import {
  Gift,
  Plus,
  Edit2,
  Trash2,
  X,
  Package,
} from 'lucide-react';

interface RedemptionItem {
  id: string;
  eventId: string;
  name: string;
  maxPerCustomer: number;
  _count?: {
    redemptions: number;
  };
}

export default function RedemptionItemsPage() {
  const { selectedEventId, selectedEvent } = useEvent();
  const [items, setItems] = useState<RedemptionItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RedemptionItem | null>(null);
  const [name, setName] = useState('');
  const [maxPerCustomer, setMaxPerCustomer] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!selectedEventId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/events/${selectedEventId}/items`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.error('Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const openCreateModal = () => {
    setEditingItem(null);
    setName('');
    setMaxPerCustomer(1);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (item: RedemptionItem) => {
    setEditingItem(item);
    setName(item.name);
    setMaxPerCustomer(item.maxPerCustomer || 1);
    setError(null);
    setModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError('Item Name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const url = editingItem
        ? `/api/items/${editingItem.id}`
        : `/api/events/${selectedEventId}/items`;
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          maxPerCustomer,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save redemption item');
      }

      await fetchItems();
      setModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Error saving item');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (id: string, itemName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${itemName}"? Any recorded redemptions for this item will also be removed.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchItems();
      }
    } catch (err) {
      alert('Error deleting item');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Redemption Items
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Configure items to distribute at check-in or specific redemption stations for{' '}
            <strong className="text-indigo-600 font-bold">{selectedEvent?.name}</strong>
          </p>
        </div>

        <button
          onClick={openCreateModal}
          disabled={!selectedEventId}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 transition disabled:opacity-50 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Redemption Item</span>
        </button>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-white border border-slate-200 rounded-3xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl p-8 shadow-xs">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 mb-1">No Redemption Items Configured</h3>
          <p className="text-sm text-slate-500 mb-6">
            Create items such as lunch boxes, merchandise, or gift bags to track per attendee.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Item</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                    <Gift className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    Max: {item.maxPerCustomer} / guest
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-600 transition mb-2">
                  {item.name}
                </h3>

                <div className="text-xs text-slate-500 mt-2">
                  Total Claims Recorded:{' '}
                  <strong className="text-indigo-600 font-extrabold">
                    {item._count?.redemptions ?? 0}
                  </strong>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
                <span className="text-[11px] text-slate-500">Guarded by unique constraint</span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openEditModal(item)}
                    title="Edit"
                    className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id, item.name)}
                    title="Delete"
                    className="p-2 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">
                {editingItem ? 'Edit Item' : 'New Redemption Item'}
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

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Lunch Buffet Box, Swag T-Shirt"
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Max Per Customer
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={maxPerCustomer}
                  onChange={(e) => setMaxPerCustomer(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
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
                    <span>{editingItem ? 'Update Item' : 'Create Item'}</span>
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
