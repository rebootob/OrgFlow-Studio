import React from 'react';
import { DiffReport } from '@orgflow/domain';
import { X, ArrowRight, UserCheck, AlertTriangle } from 'lucide-react';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseVersionName: string;
  targetVersionName: string;
  diff: DiffReport | null;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  baseVersionName,
  targetVersionName,
  diff
}) => {
  if (!isOpen || !diff) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>Organization Version Diff Comparison</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparing <span className="text-emerald-400 font-semibold">{baseVersionName}</span> (Baseline) against{' '}
              <span className="text-blue-400 font-semibold">{targetVersionName}</span> (Working Copy)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-sm">
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="text-xs text-slate-400">Employee Transfers</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{diff.movedEmployees.length}</div>
            </div>
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="text-xs text-slate-400">Created Positions</div>
              <div className="text-2xl font-bold text-blue-400 mt-1">{diff.createdPositions.length}</div>
            </div>
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="text-xs text-slate-400">Vacated Positions</div>
              <div className="text-2xl font-bold text-amber-400 mt-1">{diff.vacatedPositions.length}</div>
            </div>
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="text-xs text-slate-400">Reporting Changes</div>
              <div className="text-2xl font-bold text-purple-400 mt-1">{diff.reportingChanges.length}</div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              Employee Transfers ({diff.movedEmployees.length})
            </h3>
            {diff.movedEmployees.length === 0 ? (
              <div className="p-3 bg-slate-950/50 rounded-lg text-xs text-slate-500 italic">No employee transfers</div>
            ) : (
              <div className="space-y-1.5">
                {diff.movedEmployees.map((m, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{m.employeeName}</span>
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="px-2 py-0.5 bg-slate-800 text-rose-300 rounded border border-rose-900/50">{m.fromPosition}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      <span className="px-2 py-0.5 bg-slate-800 text-emerald-300 rounded border border-emerald-900/50">{m.toPosition}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Vacated Positions ({diff.vacatedPositions.length})
            </h3>
            {diff.vacatedPositions.length === 0 ? (
              <div className="p-3 bg-slate-950/50 rounded-lg text-xs text-slate-500 italic">No vacated positions</div>
            ) : (
              <div className="space-y-1.5">
                {diff.vacatedPositions.map((v, idx) => (
                  <div key={idx} className="p-3 bg-amber-950/20 border border-amber-900/50 rounded-lg flex items-center justify-between text-xs">
                    <span className="font-semibold text-amber-200">{v.positionCode} - {v.title}</span>
                    <span className="px-2 py-0.5 bg-amber-950 text-amber-400 rounded border border-amber-800 font-mono text-[10px]">
                      Org: {v.orgUnitCode} (Position Preserved as VACANT)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
          >
            Close Diff View
          </button>
        </div>
      </div>
    </div>
  );
};
