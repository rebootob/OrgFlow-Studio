import { memo } from 'react';
import { Handle, Position as FlowPosition } from '@xyflow/react';
import { OrgUnit, Position, Assignment, Employee } from '@orgflow/domain';
import { AlertCircle, Users, ArrowDownRight, Briefcase, Sparkles, Archive } from 'lucide-react';
import { useOrgStore } from '../store/orgStore.js';

interface PositionDetail {
  position: Position;
  assignment?: Assignment;
  employee?: Employee;
}

interface OrgUnitNodeData {
  orgUnit: OrgUnit;
  positions: PositionDetail[];
}

export const OrgUnitNode = memo(({ data }: { data: OrgUnitNodeData }) => {
  const { orgUnit, positions } = data;
  const {
    viewMode,
    selectedOrgCode,
    selectedPositionId,
    setSelectedOrgCode,
    setSelectedPositionId,
    drillDownToOrg,
    getRollupStats,
    currentRootOrgCode
  } = useOrgStore();

  const isSelected = selectedOrgCode === orgUnit.code;
  const rollup = getRollupStats(orgUnit.code);
  const isDrilledHere = currentRootOrgCode === orgUnit.code;
  const isDraftMode = viewMode === 'DRAFT';

  // Level badge colors
  const levelBadgeMap: Record<number, { bg: string; text: string; border: string }> = {
    1: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    2: { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' },
    3: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
    4: { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
    5: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
    6: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
    7: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' }
  };

  const badgeStyle = levelBadgeMap[orgUnit.level] || levelBadgeMap[5];
  const vacantCount = positions.filter(p => p.position.lifecycle === 'VACANT').length;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setSelectedOrgCode(orgUnit.code);
        setSelectedPositionId(null);
      }}
      className={`w-[360px] bg-white rounded-2xl border transition-all duration-150 shadow-xs select-none ${
        isSelected
          ? isDraftMode
            ? 'border-indigo-500 ring-4 ring-indigo-100 shadow-md'
            : 'border-emerald-500 ring-4 ring-emerald-100 shadow-md'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      {/* Top Handle for Parent Connection */}
      <Handle
        type="target"
        position={FlowPosition.Top}
        className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-white"
      />

      {/* Node Header */}
      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
            {orgUnit.type}
          </span>
          <span className="font-mono text-xs font-bold text-slate-900 truncate">
            {orgUnit.code}
          </span>

          {orgUnit.status === 'NEW' && (
            <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 rounded">
              <Sparkles className="w-2.5 h-2.5" /> NEW
            </span>
          )}
          {orgUnit.status === 'CLOSING' && (
            <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 bg-amber-50 text-amber-800 font-bold border border-amber-200 rounded">
              <Archive className="w-2.5 h-2.5" /> CLOSING
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1 font-semibold text-slate-700" title="Total Headcount in this Unit and Sub-units">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{rollup.totalHeadcount} Staff</span>
          </div>
          {vacantCount > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-medium">
              {vacantCount} vacant
            </span>
          )}
        </div>
      </div>

      {/* Org Name & Rollup Summary */}
      <div className="p-3.5 bg-slate-50/50 border-b border-slate-100">
        <div className="text-xs font-bold text-slate-900 leading-tight mb-2 truncate" title={orgUnit.name}>
          {orgUnit.name}
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Briefcase className="w-3 h-3 text-slate-400" /> {rollup.totalPositions} Positions
          </span>
          {rollup.childUnitCount > 0 && !isDrilledHere && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                drillDownToOrg(orgUnit.code);
              }}
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors ${
                isDraftMode
                  ? 'bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800'
                  : 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800'
              }`}
            >
              <span>Drill In ({rollup.childUnitCount})</span>
              <ArrowDownRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Position Cards Container */}
      <div className="p-2 space-y-1.5 max-h-[300px] overflow-y-auto">
        {positions.length === 0 ? (
          <div className="text-center py-2.5 text-xs text-slate-400 italic">No assigned positions</div>
        ) : (
          positions.map(({ position, employee }) => {
            const isVacant = position.lifecycle === 'VACANT' || !employee;
            const isPosSelected = selectedPositionId === position.id;

            return (
              <div
                key={position.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedOrgCode(orgUnit.code);
                  setSelectedPositionId(position.id);
                }}
                className={`p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                  isPosSelected
                    ? isDraftMode
                      ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-200'
                      : 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-200'
                    : isVacant
                    ? 'bg-amber-50/60 border-amber-200/80 hover:bg-amber-50 text-amber-900'
                    : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-900 truncate text-[12px]">
                    {position.title}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400 ml-1">
                    {position.code}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-0.5">
                  {isVacant ? (
                    <span className="inline-flex items-center gap-1 text-amber-700 font-medium text-[11px]">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> VACANT POSITION
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">
                        {employee.nameEN.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-700 truncate text-xs">
                        {employee.nameEN}
                      </span>
                    </div>
                  )}

                  {employee && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-500">
                      {employee.employeeCode}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Handle for Child Units */}
      <Handle
        type="source"
        position={FlowPosition.Bottom}
        className={`!w-2.5 !h-2.5 !border-2 !border-white ${
          isDraftMode ? '!bg-indigo-500' : '!bg-emerald-500'
        }`}
      />
    </div>
  );
});
