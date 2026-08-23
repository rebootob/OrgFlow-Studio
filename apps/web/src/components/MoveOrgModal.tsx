import React, { useState } from 'react';
import { useOrgStore } from '../store/orgStore.js';
import { OrgUnit } from '@orgflow/domain';
import { ArrowRight, AlertTriangle, X, Move } from 'lucide-react';

interface MoveOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUnit: OrgUnit | null;
}

export const MoveOrgModal: React.FC<MoveOrgModalProps> = ({
  isOpen,
  onClose,
  targetUnit
}) => {
  const { orgUnits, moveOrgUnit, getRollupStats } = useOrgStore();
  const [selectedNewParent, setSelectedNewParent] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !targetUnit) return null;

  const rollup = getRollupStats(targetUnit.code);
  const currentParent = orgUnits.find(o => o.code === targetUnit.parentCode);

  // Available target parents (exclude self and direct descendants)
  const candidateParents = orgUnits.filter(o => {
    if (o.code === targetUnit.code) return false;
    return true;
  });

  const handleApplyMove = () => {
    if (!selectedNewParent) {
      setErrorMessage('Please select a new parent organization.');
      return;
    }

    const res = moveOrgUnit(targetUnit.code, selectedNewParent);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to move organization.');
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
              <Move className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Move Organization Unit</h3>
              <p className="text-xs text-slate-500">Draft Reparenting Operation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Unit Info */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
              {targetUnit.type}
            </span>
            <span className="font-mono text-xs font-bold text-slate-700">{targetUnit.code}</span>
          </div>
          <div className="text-sm font-bold text-slate-900">{targetUnit.name}</div>
        </div>

        {/* Impact Scope */}
        <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2 text-xs">
          <div className="font-semibold text-indigo-950 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-indigo-600" />
            <span>Scope of Impact (Moving Subtree):</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="bg-white p-2 rounded-lg border border-indigo-100">
              <div className="text-xs font-bold text-indigo-900">{rollup.totalHeadcount}</div>
              <div className="text-[10px] text-slate-500">Employees</div>
            </div>
            <div className="bg-white p-2 rounded-lg border border-indigo-100">
              <div className="text-xs font-bold text-indigo-900">{rollup.totalPositions}</div>
              <div className="text-[10px] text-slate-500">Positions</div>
            </div>
            <div className="bg-white p-2 rounded-lg border border-indigo-100">
              <div className="text-xs font-bold text-indigo-900">{rollup.childUnitCount}</div>
              <div className="text-[10px] text-slate-500">Child Units</div>
            </div>
          </div>
        </div>

        {/* From -> To Picker */}
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-500">Current Parent:</span>
            <strong className="text-slate-800">
              {currentParent ? `${currentParent.code} (${currentParent.name})` : 'ROOT'}
            </strong>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700">Select New Parent Organization:</label>
            <select
              value={selectedNewParent}
              onChange={(e) => {
                setSelectedNewParent(e.target.value);
                setErrorMessage(null);
              }}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">-- Choose New Parent Unit --</option>
              {candidateParents.map(org => (
                <option key={org.code} value={org.code}>
                  {org.code} — {org.name} ({org.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>{errorMessage}</div>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyMove}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <span>Move in Draft</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
