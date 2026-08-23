import React, { useState } from 'react';
import { useOrgStore } from '../store/orgStore.js';
import {
  Search,
  Users,
  AlertCircle,
  Building2,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Target
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onFocusNode: (orgCode: string, positionId?: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  onFocusNode
}) => {
  const {
    orgUnits,
    positions,
    assignments,
    employees,
    searchQuery,
    setSearchQuery,
    setSelectedOrgCode,
    setSelectedPositionId
  } = useOrgStore();

  const [activeTab, setActiveTab] = useState<'PEOPLE' | 'VACANCIES' | 'DEPTS'>('PEOPLE');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');

  const asgByEmpId = new Map(assignments.map(a => [a.employeeId, a]));
  const posMap = new Map(positions.map(p => [p.id, p]));

  // Filtered employees based on search & department filter
  const filteredEmployees = employees.filter(e => {
    const q = searchQuery.trim().toLowerCase();
    const asg = asgByEmpId.get(e.id);
    const pos = asg ? posMap.get(asg.positionId) : null;

    if (selectedDeptFilter !== 'ALL' && pos && pos.orgUnitCode !== selectedDeptFilter) {
      return false;
    }

    if (!q) return false;

    return (
      e.nameEN.toLowerCase().includes(q) ||
      e.nameTH.toLowerCase().includes(q) ||
      e.employeeCode.toLowerCase().includes(q) ||
      (e.nickname && e.nickname.toLowerCase().includes(q)) ||
      (pos && pos.title.toLowerCase().includes(q)) ||
      (pos && pos.orgUnitCode.toLowerCase().includes(q))
    );
  });

  const vacantPositions = positions.filter(p => {
    if (p.lifecycle !== 'VACANT') return false;
    if (selectedDeptFilter !== 'ALL' && p.orgUnitCode !== selectedDeptFilter) return false;
    return true;
  });

  const handleSelectEmployee = (empId: string) => {
    const asg = Array.from(assignments).find(a => a.employeeId === empId);
    if (asg) {
      const pos = posMap.get(asg.positionId);
      if (pos) {
        setSelectedOrgCode(pos.orgUnitCode);
        setSelectedPositionId(pos.id);
        onFocusNode(pos.orgUnitCode, pos.id);
      }
    }
  };

  const handleSelectPosition = (posId: string) => {
    const pos = posMap.get(posId);
    if (pos) {
      setSelectedOrgCode(pos.orgUnitCode);
      setSelectedPositionId(pos.id);
      onFocusNode(pos.orgUnitCode, pos.id);
    }
  };

  const handleSelectDept = (code: string) => {
    setSelectedOrgCode(code);
    setSelectedPositionId(null);
    onFocusNode(code);
  };

  if (isCollapsed) {
    return (
      <aside className="w-12 bg-white border-r border-slate-200 flex flex-col items-center py-4 select-none z-20">
        <button
          onClick={onToggleCollapse}
          title="Expand Sidebar (Search & Directory)"
          className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-80 bg-white border-r border-slate-200 flex flex-col select-none z-20 shadow-xs">
      {/* Search & Collapse Header */}
      <div className="p-3.5 border-b border-slate-100 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-slate-500" /> Organization Directory
          </span>
          <button
            onClick={onToggleCollapse}
            title="Collapse Sidebar"
            className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input Box */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee, EMP code, position..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Department Filter */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Filter className="w-3 h-3 text-slate-400" />
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 outline-none"
          >
            <option value="ALL">All Departments ({orgUnits.length} Units)</option>
            {orgUnits
              .filter(o => o.level <= 3)
              .map(org => (
                <option key={org.code} value={org.code}>
                  {org.code} — {org.name}
                </option>
              ))}
          </select>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-[11px] font-semibold text-slate-600">
          <button
            onClick={() => setActiveTab('PEOPLE')}
            className={`flex-1 py-1 rounded-lg transition-colors flex items-center justify-center gap-1 ${
              activeTab === 'PEOPLE' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> People
          </button>
          <button
            onClick={() => setActiveTab('VACANCIES')}
            className={`flex-1 py-1 rounded-lg transition-colors flex items-center justify-center gap-1 ${
              activeTab === 'VACANCIES' ? 'bg-white text-amber-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Vacancies ({vacantPositions.length})
          </button>
          <button
            onClick={() => setActiveTab('DEPTS')}
            className={`flex-1 py-1 rounded-lg transition-colors flex items-center justify-center gap-1 ${
              activeTab === 'DEPTS' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-slate-500" /> Units
          </button>
        </div>
      </div>

      {/* Directory Content Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
        {/* TAB 1: PEOPLE */}
        {activeTab === 'PEOPLE' && (
          searchQuery.trim() === '' ? (
            <div className="py-6 px-3 text-center space-y-2 text-slate-400">
              <Users className="w-8 h-8 mx-auto text-slate-300" />
              <div className="font-semibold text-slate-600 text-xs">275 Employees in Master</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Type in the search bar above to instantly find staff by name, employee code, or position.
              </p>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="py-6 text-center text-slate-400 italic">
              No employees match "{searchQuery}"
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                Search Results ({filteredEmployees.length})
              </div>
              {filteredEmployees.map(emp => {
                const asg = asgByEmpId.get(emp.id);
                const pos = asg ? posMap.get(asg.positionId) : null;
                return (
                  <div
                    key={emp.id}
                    onClick={() => handleSelectEmployee(emp.id)}
                    className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl cursor-pointer transition-all shadow-2xs hover:border-slate-300 flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2 space-y-0.5">
                      <div className="font-semibold text-slate-900 truncate text-xs">
                        {emp.nameEN} {emp.nickname ? `(${emp.nickname})` : ''}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {pos ? pos.title : 'Unassigned'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                        <span className="font-bold text-emerald-700">{emp.employeeCode}</span>
                        <span>•</span>
                        <span>{pos ? pos.orgUnitCode : 'N/A'}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectEmployee(emp.id);
                      }}
                      title="Focus on Canvas"
                      className="p-1.5 bg-slate-100 hover:bg-emerald-600 hover:text-white rounded-lg text-slate-500 transition-colors"
                    >
                      <Target className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* TAB 2: VACANCIES */}
        {activeTab === 'VACANCIES' && (
          vacantPositions.length === 0 ? (
            <div className="py-6 px-3 text-center space-y-2 text-slate-400">
              <AlertCircle className="w-8 h-8 mx-auto text-emerald-500" />
              <div className="font-semibold text-slate-700 text-xs">0 Vacant Positions</div>
              <p className="text-[11px] text-slate-400">
                All positions in current official organization have assigned incumbents.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {vacantPositions.map(pos => (
                <div
                  key={pos.id}
                  onClick={() => handleSelectPosition(pos.id)}
                  className="p-3 bg-amber-50/50 hover:bg-amber-50 border border-amber-200 rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-amber-950">{pos.title}</div>
                    <div className="text-[11px] text-amber-700">Unit: {pos.orgUnitCode}</div>
                    <div className="font-mono text-[10px] text-amber-500">{pos.code}</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPosition(pos.id);
                    }}
                    title="Focus on Canvas"
                    className="p-1.5 bg-amber-200/60 hover:bg-amber-600 hover:text-white rounded-lg text-amber-800 transition-colors"
                  >
                    <Target className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )
        )}

        {/* TAB 3: UNITS / DEPTS */}
        {activeTab === 'DEPTS' && (
          <div className="space-y-1.5">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">
              Organization Units ({orgUnits.length})
            </div>
            {orgUnits.map(org => {
              const posInOrg = positions.filter(p => p.orgUnitCode === org.code);
              return (
                <div
                  key={org.code}
                  onClick={() => handleSelectDept(org.code)}
                  className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-900">{org.code}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 rounded text-slate-500">
                        L{org.level}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 truncate">{org.name}</div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {posInOrg.length} pos
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};