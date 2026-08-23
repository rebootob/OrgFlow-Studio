import { memo } from 'react';
import { Handle, Position as FlowPosition } from '@xyflow/react';
import { OrgUnit, Position, Assignment, Employee } from '@orgflow/domain';
import { AlertCircle, Users } from 'lucide-react';
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
  const { selectedOrgCode, selectedPositionId, setSelectedOrgCode, setSelectedPositionId } = useOrgStore();

  const isSelected = selectedOrgCode === orgUnit.code;

  // Level badge colors (subtle and friendly)
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
  const activeCount = positions.filter(p => p.position.lifecycle === 'ACTIVE').length;
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
          ? 'border-emerald-500 ring-4 ring-emerald-100 shadow-md'
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
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
            {orgUnit.type}
          </span>
          <span className="font-mono text-xs font-bold text-slate-900 truncate">
            {orgUnit.code}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-700">{activeCount}</span>
          {vacantCount > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-medium">
              {vacantCount} vacant
            </span>
          )}
        </div>
      </div>

      {/* Org Name */}
      <div className="px-4 py-2 text-xs font-semibold text-slate-800 truncate" title={orgUnit.name}>
        {orgUnit.name}
      </div>

      {/* Position Cards Container */}
      <div className="p-2 space-y-1.5 max-h-[320px] overflow-y-auto">
        {positions.length === 0 ? (
          <div className="text-center py-3 text-xs text-slate-400 italic">No assigned positions</div>
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
                className={`p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                  isPosSelected
                    ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-200'
                    : isVacant
                    ? 'bg-amber-50/60 border-amber-200/80 hover:bg-amber-50 text-amber-900'
                    : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-900 truncate text-[13px]">
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
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-500">
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
        className="!w-2.5 !h-2.5 !bg-emerald-500 !border-2 !border-white"
      />
    </div>
  );
});