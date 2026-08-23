import React, { useState } from 'react';
import { useOrgStore } from '../store/orgStore.js';
import {
  X,
  AlertCircle,
  CheckCircle2,
  Layers,
  Move,
  PlusCircle,
  Archive,
  Trash2,
  UserCheck,
  Briefcase,
  UserMinus,
  Sparkles,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';
import { resolveChartVisibility, ChartVisibility } from '@orgflow/domain';
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
    getRollupStats,
    getOrgLeader,
    vacatePosition,
    closePosition,
    removeDraftUnit,
    updatePositionVisibility
  } = useOrgStore();

  const [isMoveOrgOpen, setIsMoveOrgOpen] = useState(false);
  const [isAddOrgOpen, setIsAddOrgOpen] = useState(false);
  const [isCloseOrgOpen, setIsCloseOrgOpen] = useState(false);
  const [isAddPosOpen, setIsAddPosOpen] = useState(false);
  const [isMoveEmpOpen, setIsMoveEmpOpen] = useState(false);
  const [posFilter, setPosFilter] = useState<'ALL' | 'SHOWN' | 'HIDDEN'>('ALL');

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

  const rollup = currentOrg ? getRollupStats(currentOrg.code) : null;
  const leaderInfo = currentOrg ? getOrgLeader(currentOrg.code) : null;
  const orgPositions = currentOrg ? positions.filter(p => p.orgUnitCode === currentOrg.code && p.lifecycle !== 'CLOSED') : [];

  // Filter positions based on display policy tab
  const filteredPositions = orgPositions.filter(p => {
    const res = resolveChartVisibility({ position: p, orgUnit: currentOrg || undefined });
    if (posFilter === 'SHOWN') return res.visible;
    if (posFilter === 'HIDDEN') return !res.visible;
    return true;
  });

  const shownCount = orgPositions.filter(p => resolveChartVisibility({ position: p, orgUnit: currentOrg || undefined }).visible).length;
  const hiddenCount = orgPositions.length - shownCount;

  const currentPosResolution = currentPos
    ? resolveChartVisibility({ position: currentPos, orgUnit: currentPos.orgUnitCode ? orgMap.get(currentPos.orgUnitCode) : undefined })
    : null;

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
      <aside className="w-96 bg-white border-l border-slate-200 h-full flex flex-col shadow-lg select-none z-20 animate-in slide-in-from-right duration-200">
        {/* Panel Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {currentPos ? 'Position Inspector' : 'Organization Details'}
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

        {/* Content Body (Scrollable Detail Area) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-slate-600">
          {/* DRAFT ACTIONS (Visible only in DRAFT mode) */}
          {isDraftMode && (
            <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-600" /> Draft Actions
              </span>

              {!currentPos && currentOrg && (
                <div className="grid grid-cols-2 gap-1.5 pt-0.5">
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
                      className="p-2 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg font-semibold text-rose-800 flex items-center justify-center gap-1 transition-colors"
                    >
                      <Archive className="w-3.5 h-3.5 text-rose-600" /> Close Unit
                    </button>
                  )}
                </div>
              )}

              {currentPos && (
                <div className="flex flex-col gap-1.5 pt-0.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setIsMoveEmpOpen(true)}
                      className="p-2 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg font-semibold text-indigo-950 flex items-center justify-center gap-1 transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-indigo-600" /> Reassign / Move
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Vacate position "${currentPos.title}"?`)) {
                          vacatePosition(currentPos.id);
                        }
                      }}
                      className="p-2 bg-white hover:bg-amber-50 border border-amber-200 rounded-lg font-semibold text-amber-900 flex items-center justify-center gap-1 transition-colors"
                    >
                      <UserMinus className="w-3.5 h-3.5 text-amber-600" /> Vacate
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm(`Close position "${currentPos.title}"?`)) {
                        closePosition(currentPos.id);
                        setSelectedPositionId(null);
                      }
                    }}
                    className="p-2 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg font-semibold text-rose-800 flex items-center justify-center gap-1 transition-colors"
                  >
                    <Archive className="w-3.5 h-3.5 text-rose-600" /> Close Position
                  </button>
                </div>
              )}
            </div>
          )}

          {/* VIEW A: ORGANIZATION UNIT DETAILS */}
          {!currentPos && currentOrg && (
            <div className="space-y-4">
              {/* Leader & Summary Card */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-semibold">UNIT CODE</span>
                  <span className="font-mono font-bold text-slate-800">{currentOrg.code}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-semibold">LEVEL / TYPE</span>
                  <span className="font-semibold text-slate-800">L{currentOrg.level} • {currentOrg.type}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-semibold">PARENT UNIT</span>
                  <span className="font-mono text-slate-700">{currentOrg.parentCode || 'ROOT (Company)'}</span>
                </div>
              </div>

              {/* Rollup Metrics */}
              {rollup && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <div className="text-xs font-bold text-slate-900">{rollup.totalHeadcount}</div>
                    <div className="text-[10px] text-slate-400 font-medium">Headcount</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <div className="text-xs font-bold text-slate-900">{rollup.totalPositions}</div>
                    <div className="text-[10px] text-slate-400 font-medium">Positions</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <div className={`text-xs font-bold ${rollup.vacantCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                      {rollup.vacantCount}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">Vacancies</div>
                  </div>
                </div>
              )}

              {/* Unit Leader Card */}
              {leaderInfo && leaderInfo.position && (
                <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Unit Leadership
                  </span>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{leaderInfo.position.title}</div>
                      {leaderInfo.employee ? (
                        <div className="text-slate-600 text-[11px] font-medium">{leaderInfo.employee.nameEN}</div>
                      ) : (
                        <div className="text-amber-700 text-[11px] font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-500" /> VACANT POSITION
                        </div>
                      )}
                    </div>
                    {leaderInfo.employee && (
                      <span className="font-mono text-[10px] text-slate-400">
                        {leaderInfo.employee.employeeCode}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Full Positions and Incumbents List */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                    <span>Positions in {currentOrg.code} ({orgPositions.length})</span>
                  </h4>
                </div>

                {/* Display Policy Filter Tabs */}
                <div className="flex gap-1 p-1 bg-slate-100 rounded-lg text-[10px] font-semibold">
                  <button
                    onClick={() => setPosFilter('ALL')}
                    className={`flex-1 py-1 rounded transition-colors ${posFilter === 'ALL' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    All ({orgPositions.length})
                  </button>
                  <button
                    onClick={() => setPosFilter('SHOWN')}
                    className={`flex-1 py-1 rounded transition-colors ${posFilter === 'SHOWN' ? 'bg-white shadow-2xs text-emerald-800' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Shown ({shownCount})
                  </button>
                  <button
                    onClick={() => setPosFilter('HIDDEN')}
                    className={`flex-1 py-1 rounded transition-colors ${posFilter === 'HIDDEN' ? 'bg-white shadow-2xs text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Hidden ({hiddenCount})
                  </button>
                </div>

                {filteredPositions.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 italic">
                    No positions match the selected filter
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredPositions.map(pos => {
                      const asg = asgMap.get(pos.id);
                      const emp = asg ? empMap.get(asg.employeeId) : null;
                      const isVacant = pos.lifecycle === 'VACANT' || !emp;
                      const res = resolveChartVisibility({ position: pos, orgUnit: currentOrg || undefined });

                      return (
                        <div
                          key={pos.id}
                          onClick={() => setSelectedPositionId(pos.id)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all hover:border-slate-300 ${
                            isVacant
                              ? 'bg-amber-50/50 border-amber-200/90'
                              : 'bg-white border-slate-200 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-900 text-xs truncate max-w-[180px]">
                              {pos.title}
                            </span>
                            <div className="flex items-center gap-1">
                              {res.visible ? (
                                <span className="inline-flex items-center gap-0.5 text-[9px] px-1 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold">
                                  <Eye className="w-2.5 h-2.5" /> On Chart
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 text-[9px] px-1 py-0.2 bg-slate-100 text-slate-500 rounded font-medium">
                                  <EyeOff className="w-2.5 h-2.5" /> Hidden
                                </span>
                              )}
                              <span className="font-mono text-[10px] text-slate-400">{pos.code}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px]">
                            {emp ? (
                              <div className="flex items-center gap-1.5 text-slate-700">
                                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[9px] font-bold">
                                  {emp.nameEN.charAt(0)}
                                </div>
                                <span className="font-medium">{emp.nameEN}</span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-[10px]">
                                <AlertTriangle className="w-3 h-3 text-amber-500" />
                                VACANT POSITION
                              </span>
                            )}

                            {emp && (
                              <span className="font-mono text-[10px] text-slate-400">
                                {emp.employeeCode}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW B: POSITION & EMPLOYEE INSPECTION */}
          {currentPos && (
            <div className="space-y-4">
              <button
                onClick={() => setSelectedPositionId(null)}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                ← Back to {currentPos.orgUnitCode} Unit Details
              </button>

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

              {/* Organization Display Policy Section */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-slate-500" /> Chart Display Policy
                  </span>
                  {currentPosResolution && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold border ${
                      currentPosResolution.visible
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {currentPosResolution.visible ? 'VISIBLE ON CHART' : 'HIDDEN FROM CHART'}
                    </span>
                  )}
                </div>

                {/* Visibility Controls */}
                {isDraftMode ? (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10px] text-slate-500">Draft Visibility Override:</div>
                    <div className="grid grid-cols-3 gap-1">
                      {(['AUTO', 'SHOW', 'HIDE'] as ChartVisibility[]).map(opt => {
                        const isSelected = (currentPos.chartVisibility || 'AUTO') === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => updatePositionVisibility(currentPos.id, opt)}
                            className={`py-1 text-[10px] font-bold rounded-lg border transition-all ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-500 italic">
                    Setting: <strong className="font-mono text-slate-700">{currentPos.chartVisibility || 'AUTO'}</strong> (Read-Only)
                  </div>
                )}

                {/* Traceability Explanation */}
                {currentPosResolution && (
                  <div className="p-2 bg-slate-50 rounded-lg text-[10px] space-y-1 border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Resolution Source:</span>
                      <span className="font-mono font-semibold text-slate-700">{currentPosResolution.source}</span>
                    </div>
                    <div className="text-slate-600 leading-tight pt-0.5">
                      <span className="text-slate-400">Reason:</span> {currentPosResolution.reason}
                    </div>
                  </div>
                )}
              </div>

              {/* Position Properties */}
              <div className="space-y-2 pt-1">
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

              {/* Center Canvas Action */}
              <button
                onClick={() => onFocusNode(currentPos.orgUnitCode)}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Layers className="w-3.5 h-3.5" /> Center & Focus on Canvas
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Modals */}
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
