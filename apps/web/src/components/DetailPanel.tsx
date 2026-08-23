import React from 'react';
import { useOrgStore } from '../store/orgStore.js';
import {
  X,
  AlertCircle,
  CheckCircle2,
  Layers,
  ChevronRight
} from 'lucide-react';

interface DetailPanelProps {
  onFocusNode: (code: string) => void;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({ onFocusNode }) => {
  const {
    orgUnits,
    positions,
    assignments,
    employees,
    selectedOrgCode,
    selectedPositionId,
    setSelectedOrgCode,
    setSelectedPositionId
  } = useOrgStore();

  if (!selectedOrgCode && !selectedPositionId) {
    return null;
  }

  const asgMap = new Map(assignments.map(a => [a.positionId, a]));
  const empMap = new Map(employees.map(e => [e.id, e]));
  const orgMap = new Map(orgUnits.map(o => [o.code, o]));

  const currentOrg = selectedOrgCode ? orgMap.get(selectedOrgCode) : null;
  const currentPos = selectedPositionId ? positions.find(p => p.id === selectedPositionId) : null;
  const currentAsg = currentPos ? asgMap.get(currentPos.id) : null;
  const currentEmp = currentAsg ? empMap.get(currentAsg.employeeId) : null;

  const handleClose = () => {
    setSelectedOrgCode(null);
    setSelectedPositionId(null);
  };

  return (
    <aside className="w-88 bg-white border-l border-slate-200 h-full flex flex-col shadow-lg select-none z-20 animate-in slide-in-from-right duration-200">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {currentPos ? 'Position Inspector' : 'Organization Unit'}
          </span>
          <h2 className="text-sm font-bold text-slate-900 truncate">
            {currentPos ? currentPos.title : currentOrg?.name}
          </h2>
        </div>
        <button
          onClick={handleClose}
          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-slate-600">
        {/* If Position is Selected */}
        {currentPos && (
          <div className="space-y-4">
            {/* Status Card */}
            <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
              currentPos.lifecycle === 'VACANT' || !currentEmp
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <div className="flex items-center gap-2">
                {currentPos.lifecycle === 'VACANT' || !currentEmp ? (
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
                <div>
                  <div className="font-semibold text-xs">
                    {currentPos.lifecycle === 'VACANT' || !currentEmp ? 'Open Vacancy' : 'Active Incumbent'}
                  </div>
                  <div className="text-[11px] opacity-80">
                    {currentPos.lifecycle === 'VACANT' || !currentEmp ? 'Ready for HR allocation' : 'Assigned in Kintone App 792'}
                  </div>
                </div>
              </div>
              <span className="font-mono text-[11px] font-bold">
                {currentPos.code}
              </span>
            </div>

            {/* Employee Details Card */}
            {currentEmp ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    {currentEmp.nameEN.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs">{currentEmp.nameEN}</h3>
                    <div className="text-[11px] text-slate-500">{currentEmp.nameTH}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-[11px]">
                  <div>
                    <span className="text-slate-400">Employee Code:</span>
                    <div className="font-mono font-semibold text-slate-800">{currentEmp.employeeCode}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Nickname:</span>
                    <div className="font-semibold text-slate-800">{currentEmp.nickname || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Branch:</span>
                    <div className="font-semibold text-slate-800">{currentEmp.branch || 'BKK'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Status:</span>
                    <div className="font-semibold text-emerald-700">{currentEmp.status}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50/50 border border-dashed border-amber-300 rounded-xl text-center space-y-1">
                <AlertCircle className="w-6 h-6 text-amber-500 mx-auto" />
                <div className="font-semibold text-amber-900 text-xs">Position is Currently Vacant</div>
                <div className="text-[11px] text-amber-700">No active employee is assigned to this position.</div>
              </div>
            )}

            {/* Position Properties */}
            <div className="space-y-2 pt-2">
              <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Position Information</h4>
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 text-[11px]">
                <div className="flex justify-between py-0.5 border-b border-slate-50">
                  <span className="text-slate-500">Department / Unit:</span>
                  <strong className="text-slate-800">{currentPos.orgUnitCode}</strong>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-50">
                  <span className="text-slate-500">Unit Name:</span>
                  <span className="text-slate-800 truncate max-w-[160px]">{currentOrg?.name}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-500">Source:</span>
                  <span className="font-mono text-slate-600">Official Kintone App 791</span>
                </div>
              </div>
            </div>

            {/* Action Focus Button */}
            <button
              onClick={() => onFocusNode(currentPos.orgUnitCode)}
              className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Layers className="w-3.5 h-3.5" /> Center & Focus on Canvas
            </button>
          </div>
        )}

        {/* If Org Unit only is Selected */}
        {!currentPos && currentOrg && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between py-0.5 border-b border-slate-200">
                <span className="text-slate-500">Unit Code:</span>
                <strong className="font-mono text-slate-900">{currentOrg.code}</strong>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-200">
                <span className="text-slate-500">Level / Type:</span>
                <strong className="text-slate-800">Level {currentOrg.level} • {currentOrg.type}</strong>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-200">
                <span className="text-slate-500">Parent Unit:</span>
                <span className="font-mono text-slate-700">{currentOrg.parentCode || 'ROOT'}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Total Positions:</span>
                <strong className="text-emerald-700">
                  {positions.filter(p => p.orgUnitCode === currentOrg.code).length} Positions
                </strong>
              </div>
            </div>

            {/* Positions List in this Org Unit */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                Positions in {currentOrg.code}
              </h4>
              <div className="space-y-1.5">
                {positions
                  .filter(p => p.orgUnitCode === currentOrg.code)
                  .map(p => {
                    const asg = asgMap.get(p.id);
                    const emp = asg ? empMap.get(asg.employeeId) : null;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPositionId(p.id)}
                        className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-slate-800">{p.title}</div>
                          <div className="text-[11px] text-slate-400">
                            {emp ? `${emp.nameEN} (${emp.employeeCode})` : 'VACANT'}
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};