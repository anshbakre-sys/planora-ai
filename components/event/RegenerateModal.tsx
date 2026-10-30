'use client';

import { useState } from 'react';
import { Sparkles, ShieldCheck, X, Check, Loader2 } from 'lucide-react';

interface RegenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  lockedTaskCount: number;
  userTaskCount: number;
  favoriteIdeaCount: number;
  completedChecklistCount: number;
  onConfirm: () => Promise<void>;
}

export function RegenerateModal({
  isOpen,
  onClose,
  eventId,
  lockedTaskCount,
  userTaskCount,
  favoriteIdeaCount,
  completedChecklistCount,
  onConfirm,
}: RegenerateModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleExecute = async () => {
    try {
      setLoading(true);
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-[#E5DBCB] shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-[#E5DBCB] pb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#F5F2F9] text-[#8B7BB8] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-[#26232B]">Regenerate Event Plan</h3>
              <p className="text-xs text-[#665F6B]">Data Safety Preview & User Record Protection</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#665F6B] p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Safety Explanation Cards */}
        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#F2F7F2] border border-[#CDE3CD] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#2D5A27]">
              <ShieldCheck className="w-4 h-4 text-[#3C8C30]" />
              <span>Protected User Records (KEPT)</span>
            </div>
            <ul className="list-disc list-inside text-[#26232B] space-y-0.5 pt-1 pl-1">
              <li>{userTaskCount} custom user-created tasks preserved</li>
              <li>{lockedTaskCount} locked edited tasks preserved</li>
              <li>{favoriteIdeaCount} starred favorite ideas preserved</li>
              <li>{completedChecklistCount} completed checklist items preserved</li>
              <li>All budget allocations and actual logged expenses preserved</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FFF9E6] border border-[#FFE2A3] space-y-1 text-[#8C6D1F]">
            <span className="font-bold block">Replaced Elements:</span>
            <p className="leading-relaxed">
              Only unlocked, non-completed AI tasks, unstarred AI ideas, and unchecked AI checklist items will be refreshed with a fresh synthesis.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E5DBCB]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#E5DBCB] text-xs font-semibold text-[#665F6B]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExecute}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-[#26232B] text-[#FAF6EF] text-xs font-bold hover:bg-[#3D3845] transition-all flex items-center gap-1.5"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#C9A96A]" />
                <span>Regenerating...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-[#C9A96A]" />
                <span>Confirm & Regenerate</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

