'use client';

import { useState } from 'react';
import { formatINR } from '@/lib/date';
import {
  Briefcase,
  Plus,
  Trash2,
  CheckCircle2,
  Phone,
  Mail,
  User,
  Star,
  ShieldCheck,
  CheckSquare,
  Square,
  X,
  Loader2,
  FileCheck
} from 'lucide-react';
import {
  VENDOR_CATEGORIES,
  VENDOR_STATUSES,
  ESSENTIAL_VENDORS,
  type VendorCategory,
  type VendorStatus,
  type EventType
} from '@/lib/constants';

interface VendorItem {
  id: string;
  category: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  quote?: number | null;
  status: string;
  notes: string;
}

interface ChecklistItemRecord {
  id: string;
  vendorCategory: string;
  text: string;
  done: boolean;
  source: string;
}

interface VendorsTabProps {
  eventId: string;
  eventType: EventType;
  vendors: VendorItem[];
  checklistItems: ChecklistItemRecord[];
  onRefresh: () => void;
}

export function VendorsTab({
  eventId,
  eventType,
  vendors,
  checklistItems,
  onRefresh,
}: VendorsTabProps) {
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [showAddChecklist, setShowAddChecklist] = useState(false);

  // Vendor Form
  const [vCategory, setVCategory] = useState<VendorCategory>('Venue');
  const [vName, setVName] = useState('');
  const [vContact, setVContact] = useState('');
  const [vPhone, setVPhone] = useState('');
  const [vEmail, setVEmail] = useState('');
  const [vQuote, setVQuote] = useState<number | ''>('');
  const [vStatus, setVStatus] = useState<VendorStatus>('NOT_CONTACTED');
  const [vNotes, setVNotes] = useState('');
  const [savingVendor, setSavingVendor] = useState(false);

  // Checklist Form
  const [cCategory, setCCategory] = useState<string>('Venue');
  const [cText, setCText] = useState('');
  const [savingChecklist, setSavingChecklist] = useState(false);

  const essentialCategories = ESSENTIAL_VENDORS[eventType] || [];
  const bookedCategories = new Set(
    vendors.filter((v) => v.status === 'BOOKED').map((v) => v.category)
  );

  // Find lowest quotes per category for comparison
  const quotesByCategory: Record<string, number> = {};
  vendors.forEach((v) => {
    if (v.quote && v.quote > 0) {
      if (!quotesByCategory[v.category] || v.quote < quotesByCategory[v.category]) {
        quotesByCategory[v.category] = v.quote;
      }
    }
  });

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vName.trim()) return;

    try {
      setSavingVendor(true);
      const res = await fetch(`/api/events/${eventId}/vendors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: vCategory,
          name: vName.trim(),
          contactName: vContact.trim(),
          phone: vPhone.trim(),
          email: vEmail.trim(),
          quote: vQuote ? Number(vQuote) : null,
          status: vStatus,
          notes: vNotes.trim(),
        }),
      });
      if (!res.ok) throw new Error('Failed to add vendor');
      setVName('');
      setVContact('');
      setVPhone('');
      setVEmail('');
      setVQuote('');
      setVNotes('');
      setShowAddVendor(false);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error adding vendor');
    } finally {
      setSavingVendor(false);
    }
  };

  const handleUpdateStatus = async (vendorId: string, status: VendorStatus) => {
    try {
      await fetch(`/api/events/${eventId}/vendors`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, status }),
      });
      onRefresh();
    } catch {
      alert('Failed to update status');
    }
  };

  const handleDeleteVendor = async (vendorId: string) => {
    if (!confirm('Remove this vendor?')) return;
    try {
      await fetch(`/api/events/${eventId}/vendors?vendorId=${vendorId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      onRefresh();
    } catch {
      alert('Failed to delete vendor');
    }
  };

  const handleToggleChecklist = async (item: ChecklistItemRecord) => {
    try {
      await fetch(`/api/events/${eventId}/checklist`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, done: !item.done }),
      });
      onRefresh();
    } catch {
      alert('Failed to toggle checklist item');
    }
  };

  const handleAddChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cText.trim()) return;

    try {
      setSavingChecklist(true);
      const res = await fetch(`/api/events/${eventId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorCategory: cCategory,
          text: cText.trim(),
        }),
      });
      if (!res.ok) throw new Error('Failed to add checklist item');
      setCText('');
      setShowAddChecklist(false);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error adding checklist item');
    } finally {
      setSavingChecklist(false);
    }
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
    try {
      await fetch(`/api/events/${eventId}/checklist?itemId=${itemId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      onRefresh();
    } catch {
      alert('Failed to delete checklist item');
    }
  };

  return (
    <div className="space-y-10">
      {/* Essential Vendors Health Banner */}
      <div className="bg-white rounded-3xl p-6 border border-[#E5DBCB] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5DBCB] pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#8B7BB8]" />
            <div>
              <h2 className="font-serif text-lg font-bold text-[#26232B]">Essential Vendor Readiness</h2>
              <p className="text-xs text-[#665F6B]">
                Required vendor categories for {eventType}: {essentialCategories.join(', ')}.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#F3ECE0] text-[#26232B]">
            {bookedCategories.size} of {essentialCategories.length} Booked
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {essentialCategories.map((cat) => {
            const isBooked = bookedCategories.has(cat);
            return (
              <div
                key={cat}
                className={`p-3 rounded-2xl border flex items-center justify-between ${
                  isBooked
                    ? 'bg-[#F2F7F2] border-[#CDE3CD] text-[#2D5A27]'
                    : 'bg-[#FAF6EF] border-[#E5DBCB] text-[#665F6B]'
                }`}
              >
                <span className="font-bold">{cat}</span>
                {isBooked ? (
                  <CheckCircle2 className="w-4 h-4 text-[#3C8C30]" />
                ) : (
                  <span className="text-[10px] uppercase font-bold text-[#C9A96A]">Unbooked</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Vendors List & Quote Comparison */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DBCB] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E5DBCB] pb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#26232B]" />
            <div>
              <h2 className="font-serif text-xl font-bold text-[#26232B]">Vendor Directory & Quote Comparison</h2>
              <p className="text-xs text-[#665F6B]">
                Track quotes, booking statuses, and compare supplier bids. Lowest quote highlighted automatically.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddVendor(true)}
            className="px-4 py-2 rounded-xl bg-[#26232B] text-[#FAF6EF] text-xs font-bold hover:bg-[#3D3845] transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-[#C9A96A]" />
            <span>Add Vendor</span>
          </button>
        </div>

        {vendors.length === 0 ? (
          <p className="text-xs text-[#665F6B] text-center py-8">No vendors added yet. Add your first supplier above.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vendors.map((v) => {
              const isLowestQuote = v.quote && quotesByCategory[v.category] === v.quote;
              return (
                <div
                  key={v.id}
                  className="p-5 rounded-2xl border border-[#E5DBCB] bg-[#FAF6EF]/40 hover:bg-[#FAF6EF] transition-colors space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-white border border-[#E5DBCB] text-[#8B7BB8]">
                        {v.category}
                      </span>
                      <select
                        value={v.status}
                        onChange={(e) => handleUpdateStatus(v.id, e.target.value as VendorStatus)}
                        className={`text-[11px] font-bold px-2 py-1 rounded-md border text-xs ${
                          v.status === 'BOOKED'
                            ? 'bg-[#F2F7F2] text-[#2D5A27] border-[#CDE3CD]'
                            : v.status === 'SHORTLISTED'
                            ? 'bg-[#FFF9E6] text-[#8C6D1F] border-[#FFE2A3]'
                            : 'bg-white text-[#665F6B] border-[#E5DBCB]'
                        }`}
                      >
                        {VENDOR_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <h3 className="font-serif text-base font-bold text-[#26232B]">{v.name}</h3>
                      {v.contactName && (
                        <p className="text-xs text-[#665F6B] flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3" />
                          <span>{v.contactName}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-[#665F6B] pt-1">
                      {v.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{v.phone}</span>
                        </span>
                      )}
                      {v.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span>{v.email}</span>
                        </span>
                      )}
                    </div>

                    {v.quote ? (
                      <div className="pt-2 flex items-center gap-2">
                        <span className="text-xs font-bold text-[#26232B]">Quote: {formatINR(v.quote)}</span>
                        {isLowestQuote && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F2F7F2] text-[#3C8C30] border border-[#CDE3CD]">
                            ★ Lowest Quote in {v.category}
                          </span>
                        )}
                      </div>
                    ) : null}

                    {v.notes && (
                      <p className="text-xs text-[#665F6B] bg-white/80 p-2.5 rounded-xl border border-[#E5DBCB]/60 italic">
                        &quot;{v.notes}&quot;
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#E5DBCB] flex justify-end">
                    <button
                      onClick={() => handleDeleteVendor(v.id)}
                      className="text-xs text-[#E8735A] hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Vendor Checklist Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DBCB] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E5DBCB] pb-4">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-[#8B7BB8]" />
            <div>
              <h2 className="font-serif text-xl font-bold text-[#26232B]">Vendor Checklist</h2>
              <p className="text-xs text-[#665F6B]">
                Essential verification steps and contractual safeguards per vendor category.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddChecklist(true)}
            className="px-4 py-2 rounded-xl border border-[#E5DBCB] text-xs font-semibold text-[#26232B] hover:bg-[#FAF6EF] flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-[#8B7BB8]" />
            <span>Add Checklist Item</span>
          </button>
        </div>

        {checklistItems.length === 0 ? (
          <p className="text-xs text-[#665F6B] text-center py-6">No checklist items generated yet.</p>
        ) : (
          <div className="divide-y divide-[#F3ECE0]">
            {checklistItems.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <button onClick={() => handleToggleChecklist(item)} className="text-[#8B7BB8]">
                    {item.done ? (
                      <CheckSquare className="w-4 h-4 text-[#3C8C30]" />
                    ) : (
                      <Square className="w-4 h-4 text-[#665F6B]" />
                    )}
                  </button>
                  <span className={item.done ? 'line-through text-[#665F6B]' : 'text-[#26232B] font-medium'}>
                    {item.text}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F3ECE0] text-[#8B7BB8]">
                    {item.vendorCategory}
                  </span>
                </div>

                <button
                  onClick={() => handleDeleteChecklistItem(item.id)}
                  className="text-[#E8735A] p-1 hover:bg-[#FDEAE6] rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Vendor Modal */}
      {showAddVendor && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E5DBCB] shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E5DBCB] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#26232B]">Add Vendor Contact</h3>
              <button onClick={() => setShowAddVendor(false)} className="text-[#665F6B] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVendor} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-[#665F6B] uppercase block">Vendor Category</label>
                <select
                  value={vCategory}
                  onChange={(e) => setVCategory(e.target.value as VendorCategory)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E5DBCB] text-sm"
                >
                  {VENDOR_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#665F6B] uppercase block">Vendor / Company Name</label>
                <input
                  type="text"
                  required
                  value={vName}
                  onChange={(e) => setVName(e.target.value)}
                  placeholder="e.g., Royal Heritage Banquet & Lawn"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E5DBCB] text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#665F6B] uppercase block">Contact Person</label>
                <input
                  type="text"
                  value={vContact}
                  onChange={(e) => setVContact(e.target.value)}
                  placeholder="e.g., Mr. Sharma"
                  className="w-full px-3 py-2 rounded-xl border border-[#E5DBCB] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-[#665F6B] uppercase block">Phone</label>
                  <input
                    type="tel"
                    value={vPhone}
                    onChange={(e) => setVPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5DBCB] text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[#665F6B] uppercase block">Email</label>
                  <input
                    type="email"
                    value={vEmail}
                    onChange={(e) => setVEmail(e.target.value)}
                    placeholder="contact@venue.com"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5DBCB] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-[#665F6B] uppercase block">Quoted Price (INR)</label>
                  <input
                    type="number"
                    min={0}
                    value={vQuote}
                    onChange={(e) => setVQuote(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 250000"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5DBCB] text-sm font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[#665F6B] uppercase block">Status</label>
                  <select
                    value={vStatus}
                    onChange={(e) => setVStatus(e.target.value as VendorStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5DBCB] text-sm font-medium"
                  >
                    {VENDOR_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#665F6B] uppercase block">Notes & Negotiation Details</label>
                <textarea
                  rows={2}
                  value={vNotes}
                  onChange={(e) => setVNotes(e.target.value)}
                  placeholder="Includes AC hall, electricity backup, 50 valet slots..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E5DBCB] text-sm resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddVendor(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5DBCB] text-[#665F6B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingVendor}
                  className="px-5 py-2 rounded-xl bg-[#26232B] text-[#FAF6EF] font-bold"
                >
                  {savingVendor ? 'Saving...' : 'Save Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Checklist Modal */}
      {showAddChecklist && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E5DBCB] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5DBCB] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#26232B]">Add Checklist Item</h3>
              <button onClick={() => setShowAddChecklist(false)} className="text-[#665F6B] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddChecklistItem} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-[#665F6B] uppercase block">Vendor Category</label>
                <select
                  value={cCategory}
                  onChange={(e) => setCCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E5DBCB] text-sm"
                >
                  {VENDOR_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#665F6B] uppercase block">Checklist Requirement</label>
                <input
                  type="text"
                  required
                  value={cText}
                  onChange={(e) => setCText(e.target.value)}
                  placeholder="e.g., Review noise curfew clauses in contract"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E5DBCB] text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddChecklist(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5DBCB] text-[#665F6B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingChecklist}
                  className="px-5 py-2 rounded-xl bg-[#26232B] text-[#FAF6EF] font-bold"
                >
                  {savingChecklist ? 'Adding...' : 'Add Checklist Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

