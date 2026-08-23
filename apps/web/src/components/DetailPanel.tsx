import React, { useState } from 'react';
import { useOrgStore } from '../store/orgStore.js';
import {
  X,
  AlertCircle,
  CheckCircle2,
  Layers,
  ChevronRight,
  Move,
  PlusCircle,
  Archive,
  Trash2,
  UserCheck,
  Briefcase,
  UserMinus,
  Sparkles
} from 'lucide-react';
import { MoveOrgModal } from './MoveOrgModal.js';
import { AddOrgModal } from './AddOrgModal.js';
import { CloseOrgModal } from './CloseOrgModal.js';
import { AddPositionModal } from './AddPositionModal.js';
import { MoveEmployeeModal } from './MoveEmployeeModal.js';

interface DetailPanelProps {
  onFocusNode: (code: string) => void;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({ onFocusNode }) => {
  const {
    viewMode,
    orgUnits,
    positions,
    assignments,
    employees,
    selectedOrgCode,
    selectedPositionId,
    setSelectedOrgCode,
    setSelectedPositionId,
    vacatePosition,
    closePosition,
    removeDraftUnit
  } = useOrgStore();

  const [isMoveOrgOpen, setIsMoveOrgOpen] = useState(false);
  const [isAddOrgOpen, setIsAddOrgOpen] = useState(false);
  const [isCloseOrgOpen, setIsCloseOrgOpen] = useState(false);
  const [isAddPosOpen, setIsAddPosOpen] = useState(false);
  const [isMoveEmpOpen, setIsMoveEmpOpen] = useState(false);

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

  const isDraftMode = viewMode === 'DRAFT';

  const handleClose = () => {
    setSelectedOrgCode(null);
    setSelectedPositionId(null);
  };

  const handleRemoveDraftItem = () => {
    if (!currentOrg) return;
    if (window.confirm(`Remove draft-only unit "${currentOrg.name}" (${currentOrg.code})?`)) {
      removeDraftUnit(currentOrg.code);
    }
  };

  return (
    <>
      <aside className="w-88 bg-white border-l border-slate-200 h-full flex flex-col shadow-lg select-none z-20 animate-in slide-in-from-right duration-200">
        {/* Panel Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {currentPos ? 'Position Inspector' : 'Organization Unit'}
              </span>
              {currentOrg?.status === 'NEW' && (
                <span className="text-[10px] px-1.5 py-0.2 bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 rounded">
                  NEW
                </span>
              )}
              {currentOrg?.status === 'CLOSING' && (
                <span className="text-[10px] px-1.5 py-0.2 bg-amber-50 text-amber-800 font-bold border border-amber-200 rounded">
                  CLOSING
                </span>
              )}
            </div>
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
          {/* DRAFT ACTIONS SECTION (Visible only in DRAFT mode) */}
          {isDraftMode && (
            <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-600" /> Draft Operations
              </span>

              {/* If Org Unit selected */}
              {!currentPos && currentOrg && (
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    onClick={() => setIsMoveOrgOpen(true)}
                    className="p-2 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg font-semibold text-indigo-950 flex items-center justify-center gap-1 transition-colors"
                  >
                    <Move className="w-3.5 h-3.5 text-indigo-600" /> Move Unit
                  </button>
                  <button
                    onClick={() => setIsAddOrgOpen(true)}
                    className="p-2 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg font-semibold text-indigo-950 flex items-center justify-center gap-1 transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-indigo-600" /> + Add Child
                  </button>
                  <button
                    onClick={() => setIsAddPosOpen(true)}
                    className="p-2 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg font-semibold text-indigo-950 flex items-center justify-center gap-1 transition-colors"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-indigo-600" /> + Add Position
                  </button>
                  {currentOrg.isDraftOnly ? (
                    <button
                      onClick={handleRemoveDraftItem}
                      className="p-2 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg font-semibold text-rose-800 flex items-center justify-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Remove Draft
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsCloseOrgOpen(true)}
                      className="p-2 bg-white hover:bg-amber-50 border border-amber-200 rounded-lg font-semibold text-amber-900 flex items-center justify-center gap-1 transition-colors"
                    >
                      <Archive className="w-3.5 h-3.5 text-amber-600" /> Close Unit
                    </button>
                  )}
                </div>
              )}

              {/* If Position selected */}
              {currentPos && (
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {currentEmp && (
                    <button
                      onClick={() => setIsMoveEmpOpen(true)}
                      className="col-span-2 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center justify-center gap-1 shadow-2xs transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Reassign Employee Position
                    </button>
                  )}
                  {currentEmp && (
                    <button
                      onClick={() => vacatePosition(currentPos.id)}
                      className="p-2 bg-white hover:bg-amber-50 border border-amber-200 rounded-lg font-semibold text-amber-900 flex items-center justify-center gap-1 transition-colors"
                    >
                      <UserMinus className="w-3.5 h-3.5 text-amber-600" /> Vacate Position
                    </button>
                  )}
                  <button
                    onClick={() => closePosition(currentPos.id)}
                    className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg font-semibold text-slate-700 flex items-center justify-center gap-1 transition-colors"
                  >
                    <Archive className="w-3.5 h-3.5 text-slate-500" /> Close Position
                  </button>
                </div>
              )}
            </div>
          )}

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
                    <span className="font-mono text-slate-600">
                      {currentPos.isDraftOnly ? 'Created in Draft' : 'Official Kintone App 791'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Focus Button */}
              <button
                onClick={() => onFocusNode(currentPos.orgUnitCode)}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
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
                    .filter(p => p.orgUnitCode === currentOrg.code && p.lifecycle !== 'CLOSED')
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

      {/* Modals for Draft Operations */}
      <MoveOrgModal
        isOpen={isMoveOrgOpen}
        onClose={() => setIsMoveOrgOpen(false)}
        targetUnit={currentOrg || null}
      />

      <AddOrgModal
        isOpen={isAddOrgOpen}
        onClose={() => setIsAddOrgOpen(false)}
        parentUnit={currentOrg || null}
      />

      <CloseOrgModal
        isOpen={isCloseOrgOpen}
        onClose={() => setIsCloseOrgOpen(false)}
        targetUnit={currentOrg || null}
      />

      <AddPositionModal
        isOpen={isAddPosOpen}
        onClose={() => setIsAddPosOpen(false)}
        orgUnit={currentOrg || null}
      />

      <MoveEmployeeModal
        isOpen={isMoveEmpOpen}
        onClose={() => setIsMoveEmpOpen(false)}
        employee={currentEmp || null}
        currentPosition={currentPos || null}
      />
    </>
  );
};
