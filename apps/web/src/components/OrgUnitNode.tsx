import { memo } from 'react';
import { Handle, Position as FlowPosition } from '@xyflow/react';
import { OrgUnit, Position, Assignment, Employee } from '@orgflow/domain';
import { Users, User, AlertCircle, Building2 } from 'lucide-react';
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
  const { selectedOrgCode, setSelectedOrgCode, setSelectedPositionId } = useOrgStore();

  const isSelected = selectedOrgCode === orgUnit.code;

  const levelColorMap: Record<number, { border: string; bg: string; badge: string }> = {
    1: { border: 'border-emerald-500', bg: 'bg-emerald-950/40', badge: 'bg-emerald-600 text-white' },
    2: { border: 'border-teal-500', bg: 'bg-teal-950/40', badge: 'bg-teal-600 text-white' },
    3: { border: 'border-blue-500', bg: 'bg-blue-950/40', badge: 'bg-blue-600 text-white' },
    4: { border: 'border-indigo-500', bg: 'bg-indigo-950/40', badge: 'bg-indigo-600 text-white' },
    5: { border: 'border-purple-500', bg: 'bg-purple-950/40', badge: 'bg-purple-600 text-white' },
    6: { border: 'border-slate-500', bg: 'bg-slate-900/60', badge: 'bg-slate-700 text-slate-200' },
    7: { border: 'border-slate-600', bg: 'bg-slate-900/60', badge: 'bg-slate-800 text-slate-300' }
  };

  const colors = levelColorMap[orgUnit.level] || levelColorMap[5];
  const activeCount = positions.filter(p => p.position.lifecycle === 'ACTIVE').length;
  const vacantCount = positions.filter(p => p.position.lifecycle === 'VACANT').length;

  return (
    <div
      onClick={() => setSelectedOrgCode(orgUnit.code)}
      className={`w-[340px] rounded-xl border-2 shadow-2xl backdrop-blur-md transition-all duration-150 ${
        colors.border
      } ${colors.bg} ${isSelected ? 'ring-4 ring-emerald-400/80 shadow-emerald-900/50' : 'hover:border-slate-300'}`}
    >
      <Handle
        type="target"
        position={FlowPosition.Top}
        className="!w-3 !h-3 !bg-slate-400 !border-2 !border-slate-900"
      />

      <div className="p-3.5 border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
            {orgUnit.code}
          </span>
          <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${colors.badge}`}>
            {orgUnit.type}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Users className="w-3.5 h-3.5" />
          <span className="font-semibold">{activeCount}</span>
          {vacantCount > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] bg-amber-950/80 text-amber-300 border border-amber-800/80 rounded">
              {vacantCount} Vacant
            </span>
          )}
        </div>
      </div>

      <div className="px-3.5 py-2 font-semibold text-sm text-slate-100 truncate" title={orgUnit.name}>
        {orgUnit.name}
      </div>

      <div className="p-2 space-y-1.5 max-h-[300px] overflow-y-auto">
        {positions.length === 0 ? (
          <div className="text-center py-2 text-xs text-slate-500 italic">No assigned positions</div>
        ) : (
          positions.map(({ position, employee }) => {
            const isVacant = position.lifecycle === 'VACANT' || !employee;
            return (
              <div
                key={position.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPositionId(position.id);
                }}
                className={`p-2.5 rounded-lg border text-xs transition-colors flex items-center justify-between ${
                  isVacant
                    ? 'bg-amber-950/30 border-amber-800/60 hover:bg-amber-900/40 text-amber-200'
                    : 'bg-slate-900/90 border-slate-700/80 hover:bg-slate-800/90 text-slate-200'
                }`}
              >
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-100 truncate">{position.title}</span>
                    <span className="font-mono text-[10px] text-slate-400">({position.code})</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    {isVacant ? (
                      <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                        <AlertCircle className="w-3 h-3" /> VACANT POSITION
                      </span>
                    ) : (
                      <span className="truncate flex items-center gap-1 text-slate-300">
                        <User className="w-3 h-3 text-emerald-400" />
                        {employee.nameEN} ({employee.nickname || employee.employeeCode})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Handle
        type="source"
        position={FlowPosition.Bottom}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-slate-900"
      />
    </div>
  );
});
