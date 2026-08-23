import React, { useState } from 'react';
import { useOrgStore } from '../store/orgStore.js';
import { OrgUnit, canCloseOrgUnit } from '@orgflow/domain';
import { AlertTriangle, CheckCircle2, X, Archive } from 'lucide-react';

interface CloseOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUnit: OrgUnit | null;
}

export const CloseOrgModal: React.FC<CloseOrgModalProps> = ({
  isOpen,
  onClose,
  targetUnit
}) => {
  const { orgUnits, positions, assignments, closeOrgUnit } = useOrgStore();
  const [effectiveDate, setEffectiveDate] = useState('2026-12-31');
  const [reason, setReason] = useState('Organizational restructuring and consolidation');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !targetUnit) return null;

  const check = canCloseOrgUnit(targetUnit.code, orgUnits, positions, assignments);

  const handleApplyClose = () => {
    if (!check.allowed) return;

    const res = closeOrgUnit(targetUnit.code, effectiveDate, reason);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to close organization.');
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 text-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-sm text-slate-900">Close Organization Unit</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
          <div className="font-bold text-slate-900">{targetUnit.name}</div>
          <div className="font-mono text-slate-500">{targetUnit.code} • {targetUnit.type}</div>
        </div>

        {!check.allowed ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-900">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Cannot close this organization unit yet.</span>
            </div>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              Before closing, all remaining employees, positions, and child units must be reallocated or vacated.
            </p>
            <div className="grid grid-cols-3 gap-2 text-center pt-2">
              <div className="bg-white p-2 rounded-lg border border-amber-200">
                <div className="font-bold text-amber-900">{check.remainingStaff}</div>
                <div className="text-[10px] text-slate-500">Remaining Staff</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-amber-200">
                <div className="font-bold text-amber-900">{check.remainingPositions}</div>
                <div className="text-[10px] text-slate-500">Positions</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-amber-200">
                <div className="font-bold text-amber-900">{check.remainingChildUnits}</div>
                <div className="text-[10px] text-slate-500">Child Units</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Unit is vacant and ready to be marked as CLOSING.</span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Effective Closing Date</label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Reason / Notes</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:border-amber-500"
              />
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
            {errorMessage}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
          >
            Close
          </button>
          {check.allowed && (
            <button
              onClick={handleApplyClose}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm"
            >
              Mark Closing in Draft
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
