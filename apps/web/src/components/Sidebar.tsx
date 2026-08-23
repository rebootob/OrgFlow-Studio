import React, { useState } from 'react';
import { useOrgStore } from '../store/orgStore.js';
import { Search, Users, AlertCircle, Plus, UserPlus, ArrowRightLeft } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    positions,
    assignments,
    employees,
    searchQuery,
    setSearchQuery,
    selectedOrgCode,
    moveEmployee,
    createPosition
  } = useOrgStore();

  const [activeTab, setActiveTab] = useState<'EMPLOYEES' | 'VACANCIES'>('EMPLOYEES');
  const [selectedEmpToMove, setSelectedEmpToMove] = useState<string | null>(null);

  const asgMap = new Map(assignments.map(a => [a.employeeId, a]));
  const posMap = new Map(positions.map(p => [p.id, p]));

  const filteredEmployees = employees.filter(e => {
    const q = searchQuery.toLowerCase();
    return (
      e.nameEN.toLowerCase().includes(q) ||
      e.nameTH.toLowerCase().includes(q) ||
      e.employeeCode.toLowerCase().includes(q) ||
      (e.nickname && e.nickname.toLowerCase().includes(q))
    );
  });

  const vacantPositions = positions.filter(p => p.lifecycle === 'VACANT');

  const handleMoveToVacant = (vacantPosId: string) => {
    if (!selectedEmpToMove) {
      alert('Please select an employee from the Employee list first!');
      return;
    }
    moveEmployee(selectedEmpToMove, vacantPosId);
    setSelectedEmpToMove(null);
  };

  return (
    <aside className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col select-none">
      <div className="p-3.5 border-b border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff, code, pos..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1 mt-3 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-semibold">
          <button
            onClick={() => setActiveTab('EMPLOYEES')}
            className={`flex-1 py-1 rounded flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'EMPLOYEES' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Staff ({employees.length})
          </button>
          <button
            onClick={() => setActiveTab('VACANCIES')}
            className={`flex-1 py-1 rounded flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'VACANCIES' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" /> Vacant ({vacantPositions.length})
          </button>
        </div>
      </div>

      {selectedEmpToMove && (
        <div className="p-2.5 bg-emerald-950/80 border-b border-emerald-800/80 flex items-center justify-between text-xs">
          <div className="text-emerald-300">
            Selected: <strong>{employees.find(e => e.id === selectedEmpToMove)?.nameEN}</strong>
          </div>
          <button
            onClick={() => setSelectedEmpToMove(null)}
            className="text-[10px] text-emerald-400 hover:underline"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {activeTab === 'EMPLOYEES' && (
          filteredEmployees.slice(0, 50).map(emp => {
            const asg = asgMap.get(emp.id);
            const pos = asg ? posMap.get(asg.positionId) : undefined;
            const isSelectedForMove = selectedEmpToMove === emp.id;

            return (
              <div
                key={emp.id}
                className={`p-2.5 rounded-lg border text-xs transition-colors flex items-center justify-between ${
                  isSelectedForMove
                    ? 'bg-emerald-950 border-emerald-500 ring-2 ring-emerald-500'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="space-y-0.5 flex-1 min-w-0 pr-2">
                  <div className="font-semibold text-slate-100 truncate">
                    {emp.nameEN} {emp.nickname ? `(${emp.nickname})` : ''}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span className="font-mono text-emerald-400">{emp.employeeCode}</span>
                    <span>•</span>
                    <span className="truncate">{pos ? pos.title : 'Unassigned'}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Dept: {pos ? pos.orgUnitCode : 'N/A'}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedEmpToMove(emp.id)}
                  title="Select employee to transfer to another position"
                  className="px-2 py-1 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white rounded text-[10px] font-semibold flex items-center gap-1 transition-colors"
                >
                  <ArrowRightLeft className="w-3 h-3" /> Move
                </button>
              </div>
            );
          })
        )}

        {activeTab === 'VACANCIES' && (
          vacantPositions.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 italic">
              No vacant positions. Move an employee to create vacancies.
            </div>
          ) : (
            vacantPositions.map(pos => (
              <div
                key={pos.id}
                className="p-3 rounded-lg border border-amber-900/60 bg-amber-950/20 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-200">{pos.title}</span>
                  <span className="font-mono text-[10px] text-amber-400">{pos.code}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Unit: <span className="font-semibold text-slate-200">{pos.orgUnitCode}</span>
                </div>
                <button
                  onClick={() => handleMoveToVacant(pos.id)}
                  disabled={!selectedEmpToMove}
                  className="w-full py-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:hover:bg-amber-600 text-white font-semibold rounded text-[11px] flex items-center justify-center gap-1 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Assign Selected Staff
                </button>
              </div>
            ))
          )
        )}
      </div>

      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <button
          onClick={() => {
            const title = window.prompt('Enter new position title:', 'New Specialist');
            if (title && selectedOrgCode) {
              createPosition(selectedOrgCode, title.trim());
            } else if (!selectedOrgCode) {
              alert('Please select an Organization Unit node on the canvas first!');
            }
          }}
          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4 text-emerald-400" /> Create Draft Position
        </button>
      </div>
    </aside>
  );
};
