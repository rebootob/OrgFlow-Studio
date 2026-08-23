import { memo } from 'react';
import { Handle, Position as FlowPosition } from '@xyflow/react';
import { OrgUnit, Position, Assignment, Employee } from '@orgflow/domain';
import {
  Users,
  Briefcase,
  AlertTriangle,
  ChevronRight,
  User,
  Sparkles,
  Archive
} from 'lucide-react';
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
    canvasDisplayMode,
    selectedOrgCode,
    setSelectedOrgCode,
    setSelectedPositionId,
    drillDownToOrg,
    getRollupStats,
    getOrgLeader,
    currentRootOrgCode
  } = useOrgStore();

  const isSelected = selectedOrgCode === orgUnit.code;
  const rollup = getRollupStats(orgUnit.code);
  const leaderInfo = getOrgLeader(orgUnit.code);
  const isDrilledHere = currentRootOrgCode === orgUnit.code;
  const isDraftMode = viewMode === 'DRAFT';

  // Level badge style map
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
  const vacantCount = rollup.vacantCount;

  // Active employees for People mode preview
  const activeEmployees = positions
    .filter(p => p.employee && p.employee.id !== leaderInfo.employee?.id)
    .map(p => p.employee!);

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOrgCode(orgUnit.code);
    setSelectedPositionId(null);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (rollup.childUnitCount > 0 && !isDrilledHere) {
      drillDownToOrg(orgUnit.code);
    }
  };

  return (
    <div
      onClick={handleSelect}
      onDoubleClick={handleDoubleClick}
      className={`w-[280px] bg-white rounded-2xl border transition-all duration-150 shadow-2xs select-none ${
        isSelected
          ? isDraftMode
            ? 'border-indigo-500 ring-3 ring-indigo-100 shadow-md'
            : 'border-emerald-500 ring-3 ring-emerald-100 shadow-md'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
      }`}
    >
      {/* Top Handle for Parent Connection */}
      <Handle
        type="target"
        position={FlowPosition.Top}
        className="!w-2 !h-2 !bg-slate-400 !border-2 !border-white"
      />

      {/* 1. Header: Type & Code Badges */}
      <div className="px-3.5 pt-3 pb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
            {orgUnit.type}
          </span>
          {orgUnit.status === 'NEW' && (
            <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.2 bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 rounded">
              <Sparkles className="w-2.5 h-2.5" /> NEW
            </span>
          )}
          {orgUnit.status === 'CLOSING' && (
            <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.2 bg-amber-50 text-amber-800 font-bold border border-amber-200 rounded">
              <Archive className="w-2.5 h-2.5" /> CLOSING
            </span>
          )}
        </div>
        <span className="font-mono text-xs font-bold text-slate-700">
          {orgUnit.code}
        </span>
      </div>

      {/* 2. Organization Name (Primary Priority) */}
      <div className="px-3.5 py-1">
        <h3
          className="text-xs font-bold text-slate-900 leading-snug truncate"
          title={orgUnit.name}
        >
          {orgUnit.name}
        </h3>
      </div>

      {/* 3. Middle Section: Mode Dependent (Head / People / Overview) */}
      {canvasDisplayMode === 'ORGANIZATION' && (
        <div className="px-3.5 py-1.5 my-1 bg-slate-50/70 border-y border-slate-100/80">
          {leaderInfo.employee ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                {leaderInfo.employee.nameEN.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold text-slate-800 truncate">
                  {leaderInfo.employee.nameEN}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {leaderInfo.position?.title || 'Leader'}
                </div>
              </div>
            </div>
          ) : leaderInfo.isVacant ? (
            <div className="flex items-center gap-1.5 text-amber-800 text-[11px]">
              <User className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-amber-900 truncate">
                  {leaderInfo.position?.title || 'Head Position'}
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-100/70 border border-amber-200 rounded text-amber-800 inline-block">
                  VACANT LEADER
                </span>
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-slate-400 italic py-0.5 flex items-center gap-1">
              <User className="w-3 h-3 text-slate-300" />
              <span>Head not defined</span>
            </div>
          )}
        </div>
      )}

      {canvasDisplayMode === 'PEOPLE' && (
        <div className="px-3.5 py-1.5 my-1 bg-slate-50/70 border-y border-slate-100/80 space-y-1">
          {leaderInfo.employee && (
            <div className="text-[11px] font-bold text-slate-800 truncate flex items-center gap-1">
              <User className="w-3 h-3 text-indigo-600 shrink-0" />
              <span>{leaderInfo.employee.nameEN}</span>
              <span className="text-[9px] text-slate-400 font-normal">({leaderInfo.position?.title})</span>
            </div>
          )}
          <div className="text-[10px] text-slate-600 flex flex-wrap gap-1 items-center">
            {activeEmployees.slice(0, 2).map((emp) => (
              <span key={emp.id} className="bg-white px-1.5 py-0.2 border border-slate-200 rounded text-slate-700 truncate max-w-[110px]">
                {emp.nameEN.split(' ')[0]}
              </span>
            ))}
            {activeEmployees.length > 2 && (
              <span className="text-[9px] font-semibold text-indigo-600">
                +{activeEmployees.length - 2} more
              </span>
            )}
            {activeEmployees.length === 0 && !leaderInfo.employee && (
              <span className="italic text-slate-400">0 Staff members</span>
            )}
          </div>
        </div>
      )}

      {/* 4. Bottom Summary Metrics Bar */}
      <div className="px-3.5 py-2 flex items-center justify-between text-[11px] text-slate-600">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1 font-medium" title="Total Headcount in Unit & Sub-units">
            <Users className="w-3 h-3 text-slate-400" />
            <strong className="text-slate-800">{rollup.totalHeadcount}</strong>
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1 font-medium" title="Total Positions in Unit & Sub-units">
            <Briefcase className="w-3 h-3 text-slate-400" />
            <span>{rollup.totalPositions}</span>
          </span>
          {vacantCount > 0 && (
            <>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-0.5 font-bold text-amber-700 px-1 py-0.2 bg-amber-50 border border-amber-200/80 rounded" title="Vacant Positions">
                <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                <span>{vacantCount}</span>
              </span>
            </>
          )}
        </div>

        {/* Drill in action */}
        {rollup.childUnitCount > 0 && !isDrilledHere && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              drillDownToOrg(orgUnit.code);
            }}
            title={`Drill in to view ${rollup.childUnitCount} child units`}
            className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 py-0.5 px-1 rounded hover:bg-emerald-50 transition-colors"
          >
            <span>Drill in</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Bottom Handle for Child Units */}
      <Handle
        type="source"
        position={FlowPosition.Bottom}
        className={`!w-2 !h-2 !border-2 !border-white ${
          isDraftMode ? '!bg-indigo-500' : '!bg-emerald-500'
        }`}
      />
    </div>
  );
});
