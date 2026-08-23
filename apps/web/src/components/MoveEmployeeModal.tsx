import React, { useState } from 'react';
import { useOrgStore } from '../store/orgStore.js';
import { Employee, Position } from '@orgflow/domain';
import { UserCheck, ArrowRight, X, AlertCircle } from 'lucide-react';

interface MoveEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  currentPosition: Position | null;
}

export const MoveEmployeeModal: React.FC<MoveEmployeeModalProps> = ({
  isOpen,
  onClose,
  employee,
  currentPosition
}) => {
  const { positions, assignments, moveEmployee } = useOrgStore();
  const [targetPositionId, setTargetPositionId] = useState('');

  if (!isOpen || !employee) return null;

  const asgMap = new Map(assignments.map(a => [a.positionId, a]));

  const candidatePositions = positions.filter(p => p.id !== currentPosition?.id && p.lifecycle !== 'CLOSED');

  const handleApplyMove = () => {
    if (!targetPositionId) return;

    moveEmployee(employee.id, targetPositionId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 text-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">Reassign Employee Position</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Employee Card */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900">{employee.nameEN}</span>
            <span className="font-mono text-emerald-700 font-bold">{employee.employeeCode}</span>
          </div>
          <div className="text-slate-500">
            Current Position: <strong className="text-slate-700">{currentPosition?.title || 'Unassigned'}</strong>
          </div>
        </div>

        {/* Vacancy Notice */}
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Moving this employee will leave the current position marked as <strong>VACANT</strong>.</span>
        </div>

        {/* Target Position Selection */}
        <div className="space-y-2 text-xs">
          <label className="font-semibold text-slate-700 block">Select Target Position:</label>
          <select
            value={targetPositionId}
            onChange={(e) => setTargetPositionId(e.target.value)}
            className="w-full p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:border-indigo-500 max-h-48"
          >
            <option value="">-- Select Target Position --</option>
            {candidatePositions.map(pos => {
              const isVacant = pos.lifecycle === 'VACANT' || !asgMap.has(pos.id);
              return (
                <option key={pos.id} value={pos.id}>
                  {pos.orgUnitCode} • {pos.title} {isVacant ? '★ (VACANT)' : ''}
                </option>
              );
            })}
          </select>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyMove}
            disabled={!targetPositionId}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <span>Reassign in Draft</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
