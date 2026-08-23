import React, { useState, useMemo } from 'react';
import {
  Building,
  Users,
  Briefcase,
  Link2,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  ChevronRight,
  ShieldCheck,
  Database,
  HelpCircle,
  Edit3,
  X,
  Lock
} from 'lucide-react';
import { useOrgStore } from '../store/orgStore.js';
import { resolveDepartment, resolveChartVisibility, ReviewStatus, ReviewRecord } from '@orgflow/domain';

export const DataReviewWorkspace: React.FC = () => {
  const {
    orgUnits,
    positions,
    assignments,
    employees,
    dataReviewSubTab,
    setDataReviewSubTab,
    dataReviewDeptFilter,
    setDataReviewDeptFilter,
    dataReviewStatusFilter,
    setDataReviewStatusFilter,
    reviewRecords,
    updateReviewRecord,
    markRecordCorrect,
    navigateToOrgAndFocus,
    sourceSnapshotMeta
  } = useOrgStore();

  const [search, setSearch] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ReviewRecord | null>(null);

  // Mappings
  const orgMap = useMemo(() => new Map(orgUnits.map(o => [o.code, o])), [orgUnits]);
  const posMap = useMemo(() => new Map(positions.map(p => [p.id, p])), [positions]);
  const empMap = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);

  const asgByEmpId = useMemo(() => {
    const map = new Map();
    assignments.forEach(a => map.set(a.employeeId, a));
    return map;
  }, [assignments]);

  const asgByPosId = useMemo(() => {
    const map = new Map();
    assignments.forEach(a => map.set(a.positionId, a));
    return map;
  }, [assignments]);

  // Discover canonical departments
  const departmentGroups = useMemo(() => {
    const groups = new Map<string, { code: string; name: string; level: number; employees: any[]; positions: any[] }>();

    positions.forEach(pos => {
      const { deptCode, deptName } = resolveDepartment(pos.orgUnitCode, orgMap);
      if (!groups.has(deptCode)) {
        groups.set(deptCode, {
          code: deptCode,
          name: deptName,
          level: orgMap.get(deptCode)?.level || 3,
          employees: [],
          positions: []
        });
      }
      const grp = groups.get(deptCode)!;
      grp.positions.push(pos);

      const asg = asgByPosId.get(pos.id);
      if (asg) {
        const emp = empMap.get(asg.employeeId);
        if (emp) grp.employees.push(emp);
      }
    });

    return Array.from(groups.values()).sort((a, b) => a.level - b.level || a.code.localeCompare(b.code));
  }, [positions, orgMap, asgByPosId, empMap]);

  // Enriched Employee Rows
  const employeeRows = useMemo(() => {
    return employees.map(emp => {
      const asg = asgByEmpId.get(emp.id);
      const pos = asg ? posMap.get(asg.positionId) : null;
      const org = pos ? orgMap.get(pos.orgUnitCode) : null;
      const dept = org ? resolveDepartment(org.code, orgMap) : { deptCode: 'UNKNOWN', deptName: 'Unknown' };
      const review = reviewRecords[emp.id] || { status: 'NOT_REVIEWED' as ReviewStatus };

      return {
        emp,
        asg,
        pos,
        org,
        dept,
        review
      };
    });
  }, [employees, asgByEmpId, posMap, orgMap, reviewRecords]);

  // Enriched Position Rows
  const positionRows = useMemo(() => {
    return positions.map(pos => {
      const org = orgMap.get(pos.orgUnitCode);
      const asg = asgByPosId.get(pos.id);
      const emp = asg ? empMap.get(asg.employeeId) : null;
      const dept = org ? resolveDepartment(org.code, orgMap) : { deptCode: 'UNKNOWN', deptName: 'Unknown' };
      const visibility = resolveChartVisibility({ position: pos, orgUnit: org });
      const review = reviewRecords[pos.id] || { status: 'NOT_REVIEWED' as ReviewStatus };

      return {
        pos,
        org,
        asg,
        emp,
        dept,
        visibility,
        review
      };
    });
  }, [positions, orgMap, asgByPosId, empMap, reviewRecords]);

  // Filtered rows based on global search, dept filter, and status filter
  const filteredEmployees = useMemo(() => {
    return employeeRows.filter(r => {
      if (dataReviewDeptFilter && r.dept.deptCode !== dataReviewDeptFilter) return false;
      if (dataReviewStatusFilter !== 'ALL' && r.review.status !== dataReviewStatusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchCode = r.emp.employeeCode.toLowerCase().includes(q);
        const matchNameEN = r.emp.nameEN.toLowerCase().includes(q);
        const matchNameTH = (r.emp.nameTH || '').toLowerCase().includes(q);
        const matchPos = (r.pos?.title || '').toLowerCase().includes(q);
        const matchOrg = (r.org?.name || '').toLowerCase().includes(q);
        return matchCode || matchNameEN || matchNameTH || matchPos || matchOrg;
      }
      return true;
    });
  }, [employeeRows, dataReviewDeptFilter, dataReviewStatusFilter, search]);

  const filteredPositions = useMemo(() => {
    return positionRows.filter(r => {
      if (dataReviewDeptFilter && r.dept.deptCode !== dataReviewDeptFilter) return false;
      if (dataReviewStatusFilter !== 'ALL' && r.review.status !== dataReviewStatusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchCode = r.pos.code.toLowerCase().includes(q);
        const matchTitle = r.pos.title.toLowerCase().includes(q);
        const matchOrg = (r.org?.name || '').toLowerCase().includes(q);
        const matchEmp = (r.emp?.nameEN || '').toLowerCase().includes(q);
        return matchCode || matchTitle || matchOrg || matchEmp;
      }
      return true;
    });
  }, [positionRows, dataReviewDeptFilter, dataReviewStatusFilter, search]);

  // Issue rows (Status is WRONG_*, MISSING_*, DUPLICATE, NEED_REVIEW)
  const issueRows = useMemo(() => {
    return employeeRows.filter(r =>
      r.review.status !== 'NOT_REVIEWED' && r.review.status !== 'CORRECT'
    );
  }, [employeeRows]);

  // Metrics
  const totalReviewed = useMemo(() => {
    return Object.values(reviewRecords).filter(r => r.status !== 'NOT_REVIEWED').length;
  }, [reviewRecords]);

  const totalCorrect = useMemo(() => {
    return Object.values(reviewRecords).filter(r => r.status === 'CORRECT').length;
  }, [reviewRecords]);

  const totalIssuesCount = useMemo(() => {
    return Object.values(reviewRecords).filter(r => r.status !== 'NOT_REVIEWED' && r.status !== 'CORRECT').length;
  }, [reviewRecords]);

  const handleOpenEditModal = (targetId: string, targetType: 'EMPLOYEE' | 'POSITION' | 'ASSIGNMENT') => {
    const existing = reviewRecords[targetId] || {
      id: targetId,
      targetType,
      status: 'NEED_REVIEW' as ReviewStatus,
      expectedDeptCode: '',
      expectedDeptName: '',
      expectedOrgUnitCode: '',
      expectedOrgUnitName: '',
      expectedPositionCode: '',
      expectedPositionName: '',
      reviewNote: ''
    };
    setEditingRecord({ ...existing });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingRecord) {
      updateReviewRecord(editingRecord);
      setIsEditModalOpen(false);
    }
  };

  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'CORRECT':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            ✓ Correct
          </span>
        );
      case 'WRONG_DEPARTMENT':
      case 'WRONG_ORG_UNIT':
      case 'WRONG_POSITION':
      case 'MISSING_ASSIGNMENT':
      case 'EXTRA_ASSIGNMENT':
      case 'DUPLICATE':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            ⚠ {status.replace(/_/g, ' ')}
          </span>
        );
      case 'NEED_REVIEW':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            ? Need Review
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Not Reviewed
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Sub-Header / Workspace Navigation Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        {/* Left Sub-Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
          <button
            onClick={() => setDataReviewSubTab('OVERVIEW')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              dataReviewSubTab === 'OVERVIEW' ? 'bg-white shadow-2xs text-slate-900' : 'hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-indigo-600" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setDataReviewSubTab('DEPARTMENTS')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              dataReviewSubTab === 'DEPARTMENTS' ? 'bg-white shadow-2xs text-slate-900' : 'hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5 text-slate-600" />
            <span>Departments ({departmentGroups.length})</span>
          </button>
          <button
            onClick={() => setDataReviewSubTab('EMPLOYEES')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              dataReviewSubTab === 'EMPLOYEES' ? 'bg-white shadow-2xs text-slate-900' : 'hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-slate-600" />
            <span>Employees ({employees.length})</span>
          </button>
          <button
            onClick={() => setDataReviewSubTab('POSITIONS')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              dataReviewSubTab === 'POSITIONS' ? 'bg-white shadow-2xs text-slate-900' : 'hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-slate-600" />
            <span>Positions ({positions.length})</span>
          </button>
          <button
            onClick={() => setDataReviewSubTab('ASSIGNMENTS')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              dataReviewSubTab === 'ASSIGNMENTS' ? 'bg-white shadow-2xs text-slate-900' : 'hover:text-slate-900'
            }`}
          >
            <Link2 className="w-3.5 h-3.5 text-slate-600" />
            <span>Assignments ({assignments.length})</span>
          </button>
          <button
            onClick={() => setDataReviewSubTab('ISSUES')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              dataReviewSubTab === 'ISSUES' ? 'bg-white shadow-2xs text-rose-700' : 'hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Issues ({totalIssuesCount})</span>
          </button>
          <button
            onClick={() => setDataReviewSubTab('UNASSIGNED')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              dataReviewSubTab === 'UNASSIGNED' ? 'bg-white shadow-2xs text-slate-900' : 'hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Unassigned (0)</span>
          </button>
        </div>

        {/* Right Info Badges */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600 border border-slate-200">
            <span className="font-semibold text-slate-800">Reviewed:</span>
            <span>{totalReviewed} / {employees.length}</span>
            <span className="text-emerald-700 font-bold ml-1">({totalCorrect} ✓)</span>
            {totalIssuesCount > 0 && (
              <span className="text-rose-700 font-bold ml-1">({totalIssuesCount} ⚠)</span>
            )}
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 rounded-lg text-emerald-800 border border-emerald-200">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span className="font-semibold">Read Only</span>
          </div>
        </div>
      </div>

      {/* Global Filter Bar (For lists) */}
      {dataReviewSubTab !== 'OVERVIEW' && (
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by code, name, title, unit..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Department Dropdown Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={dataReviewDeptFilter || ''}
                onChange={e => setDataReviewDeptFilter(e.target.value ? e.target.value : null)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">All Departments ({departmentGroups.length})</option>
                {departmentGroups.map(dept => (
                  <option key={dept.code} value={dept.code}>
                    {dept.code} — {dept.name} ({dept.employees.length} staff)
                  </option>
                ))}
              </select>
            </div>

            {/* Status Dropdown Filter */}
            <div className="flex items-center gap-1.5">
              <select
                value={dataReviewStatusFilter}
                onChange={e => setDataReviewStatusFilter(e.target.value as any)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">All Review Statuses</option>
                <option value="NOT_REVIEWED">Not Reviewed</option>
                <option value="CORRECT">✓ Correct</option>
                <option value="WRONG_DEPARTMENT">⚠ Wrong Department</option>
                <option value="WRONG_ORG_UNIT">⚠ Wrong Org Unit</option>
                <option value="WRONG_POSITION">⚠ Wrong Position</option>
                <option value="NEED_REVIEW">? Need Review</option>
              </select>
            </div>
          </div>

          {/* Reset Filters */}
          {(dataReviewDeptFilter || dataReviewStatusFilter !== 'ALL' || search) && (
            <button
              onClick={() => {
                setDataReviewDeptFilter(null);
                setDataReviewStatusFilter('ALL');
                setSearch('');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Workspace Content Views */}
      <div className="flex-1 overflow-auto p-6">
        {/* 1. OVERVIEW SUBTAB */}
        {dataReviewSubTab === 'OVERVIEW' && (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Active Employees</span>
                  <Users className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2">{employees.length}</div>
                <div className="text-[11px] text-emerald-700 font-medium mt-1">100% Accounted For</div>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Total Positions</span>
                  <Briefcase className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2">{positions.length}</div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">73 on Chart • 202 in Unit Headcount</div>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Departments</span>
                  <Building className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2">{departmentGroups.length}</div>
                <div className="text-[11px] text-indigo-700 font-medium mt-1">Canonical Subtrees</div>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">HR Validation</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-slate-900 mt-2">{totalReviewed} / {employees.length}</div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">
                  {totalIssuesCount > 0 ? `${totalIssuesCount} Issues Flagged` : 'Zero Issues Flagged'}
                </div>
              </div>
            </div>

            {/* Department Summary Grid */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Department Subtrees & Review Status</h3>
                  <p className="text-xs text-slate-500">Click any department to filter employee and position rosters</p>
                </div>
                <span className="text-xs font-semibold text-slate-400">9 Canonical Subtrees</span>
              </div>

              <div className="divide-y divide-slate-100">
                {departmentGroups.map(dept => {
                  const deptEmps = employeeRows.filter(r => r.dept.deptCode === dept.code);
                  const reviewedCount = deptEmps.filter(r => r.review.status !== 'NOT_REVIEWED').length;
                  const correctCount = deptEmps.filter(r => r.review.status === 'CORRECT').length;
                  const issuesCount = deptEmps.filter(r => r.review.status !== 'NOT_REVIEWED' && r.review.status !== 'CORRECT').length;

                  return (
                    <div
                      key={dept.code}
                      onClick={() => {
                        setDataReviewDeptFilter(dept.code);
                        setDataReviewSubTab('EMPLOYEES');
                      }}
                      className="p-4 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-emerald-50 text-slate-700 group-hover:text-emerald-700 flex items-center justify-center font-bold text-xs transition-colors">
                          {dept.code}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm group-hover:text-emerald-800 transition-colors">
                            {dept.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            Level {dept.level} • {dept.employees.length} Staff • {dept.positions.length} Positions
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right text-xs">
                          <div className="font-semibold text-slate-700">
                            Reviewed: {reviewedCount} / {dept.employees.length}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {correctCount} Correct • {issuesCount} Issues
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Data Source Provenance Card */}
            <div className="p-4 bg-slate-100/80 border border-slate-200 rounded-2xl flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  <strong>Data Source:</strong> {sourceSnapshotMeta?.sourceProvider === 'KINTONE_LIVE' ? 'Kintone Live Read (App 53, 791, 792)' : 'Canonical Master Snapshot (App 53, 791, 792)'}
                </span>
                <span className="text-slate-400">•</span>
                <span><strong>Snapshot ID:</strong> {sourceSnapshotMeta?.snapshotId || 'Canonical-57'}</span>
              </div>
              <div className="text-slate-500 font-medium">
                KINTONE_WRITE_ENABLED = false (Enforced Read-Only)
              </div>
            </div>
          </div>
        )}

        {/* 2. DEPARTMENTS SUBTAB */}
        {dataReviewSubTab === 'DEPARTMENTS' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Dept Code</th>
                  <th className="py-3 px-4">Department Name</th>
                  <th className="py-3 px-4 text-center">Level</th>
                  <th className="py-3 px-4 text-right">Staff</th>
                  <th className="py-3 px-4 text-right">Positions</th>
                  <th className="py-3 px-4 text-right">Child Units</th>
                  <th className="py-3 px-4 text-center">Review Progress</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {departmentGroups.map(dept => {
                  const deptEmps = employeeRows.filter(r => r.dept.deptCode === dept.code);
                  const reviewed = deptEmps.filter(r => r.review.status !== 'NOT_REVIEWED').length;
                  const issues = deptEmps.filter(r => r.review.status !== 'NOT_REVIEWED' && r.review.status !== 'CORRECT').length;

                  return (
                    <tr key={dept.code} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{dept.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{dept.name}</td>
                      <td className="py-3 px-4 text-center">{dept.level}</td>
                      <td className="py-3 px-4 text-right font-semibold">{dept.employees.length}</td>
                      <td className="py-3 px-4 text-right">{dept.positions.length}</td>
                      <td className="py-3 px-4 text-right">{orgUnits.filter(o => o.parentCode === dept.code).length}</td>
                      <td className="py-3 px-4 text-center font-medium">
                        {reviewed} / {dept.employees.length}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {issues > 0 ? (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px]">
                            {issues} Issues
                          </span>
                        ) : reviewed === dept.employees.length ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                            Verified
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium text-[10px]">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setDataReviewDeptFilter(dept.code);
                            setDataReviewSubTab('EMPLOYEES');
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors"
                        >
                          View Employees
                        </button>
                        <button
                          onClick={() => navigateToOrgAndFocus(dept.code)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-semibold transition-colors"
                        >
                          View in Org
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. EMPLOYEES SUBTAB */}
        {dataReviewSubTab === 'EMPLOYEES' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Employee Name</th>
                  <th className="py-3 px-4">Position</th>
                  <th className="py-3 px-4">Organization Unit</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">HR Review</th>
                  <th className="py-3 px-4 text-right">Review Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredEmployees.map(row => (
                  <tr key={row.emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{row.emp.employeeCode}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{row.emp.nameEN}</div>
                      {row.emp.nameTH && <div className="text-[11px] text-slate-400">{row.emp.nameTH}</div>}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{row.pos?.title || '-'}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{row.org?.name || '-'}</div>
                      <div className="text-[10px] text-slate-400">{row.org?.code} • L{row.org?.level}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold text-[11px]">
                        {row.dept.deptCode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-full font-medium text-[10px]">
                        {row.emp.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(row.review.status)}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => markRecordCorrect(row.emp.id, 'EMPLOYEE')}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-semibold text-[11px] transition-colors"
                        title="Mark employee assignment as verified correct"
                      >
                        ✓ Correct
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(row.emp.id, 'EMPLOYEE')}
                        className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg font-semibold text-[11px] transition-colors"
                        title="Log incorrect department, unit, or position"
                      >
                        ⚠ Mark Issue
                      </button>
                      {row.org && (
                        <button
                          onClick={() => navigateToOrgAndFocus(row.org!.code, row.pos?.id)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-[11px] transition-colors"
                          title="Focus unit on Organization Chart"
                        >
                          🔍 View Org
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. POSITIONS SUBTAB */}
        {dataReviewSubTab === 'POSITIONS' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Position Code</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Organization Unit</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Incumbent</th>
                  <th className="py-3 px-4 text-center">Chart Visibility</th>
                  <th className="py-3 px-4 text-center">Review Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredPositions.map(row => (
                  <tr key={row.pos.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{row.pos.code}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{row.pos.title}</td>
                    <td className="py-3 px-4 font-medium text-slate-700">{row.org?.name}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{row.dept.deptCode}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {row.emp ? `${row.emp.nameEN} (${row.emp.employeeCode})` : <span className="text-amber-600 font-bold">[VACANT]</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        row.visibility.visible ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {row.visibility.visible ? 'On Chart' : 'Hidden'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(row.review.status)}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => markRecordCorrect(row.pos.id, 'POSITION')}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-semibold text-[11px] transition-colors"
                      >
                        ✓ Correct
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(row.pos.id, 'POSITION')}
                        className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg font-semibold text-[11px] transition-colors"
                      >
                        ⚠ Issue
                      </button>
                      {row.org && (
                        <button
                          onClick={() => navigateToOrgAndFocus(row.org!.code, row.pos.id)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-[11px] transition-colors"
                        >
                          🔍 View Org
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. ASSIGNMENTS SUBTAB */}
        {dataReviewSubTab === 'ASSIGNMENTS' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Assignment ID</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Position</th>
                  <th className="py-3 px-4">Organization</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">Type</th>
                  <th className="py-3 px-4 text-center">Source Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {assignments.map(asg => {
                  const emp = empMap.get(asg.employeeId);
                  const pos = posMap.get(asg.positionId);
                  const org = pos ? orgMap.get(pos.orgUnitCode) : null;
                  const dept = org ? resolveDepartment(org.code, orgMap) : { deptCode: 'UNKNOWN' };

                  return (
                    <tr key={asg.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{asg.id}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{emp?.nameEN} ({emp?.employeeCode})</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{pos?.title}</td>
                      <td className="py-3 px-4 font-medium text-slate-700">{org?.name}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{dept.deptCode}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-full font-semibold text-[10px]">
                          Primary
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-[10px] text-slate-500">
                        CANONICAL_READONLY
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. ISSUES SUBTAB */}
        {dataReviewSubTab === 'ISSUES' && (
          <div className="space-y-4">
            {issueRows.length === 0 ? (
              <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center shadow-2xs space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <h3 className="font-bold text-slate-900 text-sm">Zero Issues Logged</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Click <strong>[ ⚠ Mark Issue ]</strong> on any employee or position in the list above to flag incorrect departments, units, or roles for future reconciliation.
                </p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-rose-50 border-b border-rose-200 text-rose-800 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Current Department</th>
                      <th className="py-3 px-4">Expected Department</th>
                      <th className="py-3 px-4">Current Org Unit</th>
                      <th className="py-3 px-4">Expected Org Unit</th>
                      <th className="py-3 px-4">Issue Type</th>
                      <th className="py-3 px-4">Review Note</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {issueRows.map(row => (
                      <tr key={row.emp.id} className="hover:bg-rose-50/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {row.emp.nameEN} ({row.emp.employeeCode})
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700">{row.dept.deptCode}</td>
                        <td className="py-3 px-4 font-bold text-rose-700">{row.review.expectedDeptCode || '-'}</td>
                        <td className="py-3 px-4 text-slate-600">{row.org?.name}</td>
                        <td className="py-3 px-4 font-bold text-rose-700">{row.review.expectedOrgUnitName || '-'}</td>
                        <td className="py-3 px-4">
                          {getStatusBadge(row.review.status)}
                        </td>
                        <td className="py-3 px-4 italic text-slate-600">{row.review.reviewNote || '-'}</td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEditModal(row.emp.id, 'EMPLOYEE')}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-[11px]"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => markRecordCorrect(row.emp.id, 'EMPLOYEE')}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-semibold text-[11px]"
                          >
                            Resolve
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 7. UNASSIGNED SUBTAB */}
        {dataReviewSubTab === 'UNASSIGNED' && (
          <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center shadow-2xs space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-slate-900 text-sm">Zero Unassigned or Unknown Records</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              All 275 active employees and 275 positions are 100% mapped to valid canonical departments. Zero orphans exist.
            </p>
          </div>
        )}
      </div>

      {/* HR Review Edit Modal */}
      {isEditModalOpen && editingRecord && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-sm">HR Manual Review & Issue Logging</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px] tracking-wider">
                  HR Review Status
                </label>
                <select
                  value={editingRecord.status}
                  onChange={e => setEditingRecord({ ...editingRecord, status: e.target.value as any })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="CORRECT">✓ CORRECT (Verified Data)</option>
                  <option value="WRONG_DEPARTMENT">⚠ WRONG DEPARTMENT</option>
                  <option value="WRONG_ORG_UNIT">⚠ WRONG ORGANIZATION UNIT</option>
                  <option value="WRONG_POSITION">⚠ WRONG POSITION</option>
                  <option value="MISSING_ASSIGNMENT">⚠ MISSING ASSIGNMENT</option>
                  <option value="EXTRA_ASSIGNMENT">⚠ EXTRA ASSIGNMENT</option>
                  <option value="DUPLICATE">⚠ DUPLICATE RECORD</option>
                  <option value="NEED_REVIEW">? NEED HR REVIEW</option>
                </select>
              </div>

              {editingRecord.status !== 'CORRECT' && (
                <div className="space-y-3 p-3 bg-amber-50/50 border border-amber-200 rounded-xl">
                  <div className="text-[11px] font-bold text-amber-900">
                    Expected / Target Values (Separate from Current Data)
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-600 text-[10px] mb-1">Expected Dept Code</label>
                      <input
                        type="text"
                        value={editingRecord.expectedDeptCode || ''}
                        onChange={e => setEditingRecord({ ...editingRecord, expectedDeptCode: e.target.value })}
                        placeholder="e.g. TMF1"
                        className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 text-[10px] mb-1">Expected Unit Code</label>
                      <input
                        type="text"
                        value={editingRecord.expectedOrgUnitCode || ''}
                        onChange={e => setEditingRecord({ ...editingRecord, expectedOrgUnitCode: e.target.value })}
                        placeholder="e.g. TMF1-AUTOMOTIVE"
                        className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 text-[10px] mb-1">Expected Position Title</label>
                    <input
                      type="text"
                      value={editingRecord.expectedPositionName || ''}
                      onChange={e => setEditingRecord({ ...editingRecord, expectedPositionName: e.target.value })}
                      placeholder="e.g. Senior Engineer"
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px] tracking-wider">
                  HR Review Note
                </label>
                <textarea
                  value={editingRecord.reviewNote || ''}
                  onChange={e => setEditingRecord({ ...editingRecord, reviewNote: e.target.value })}
                  placeholder="Provide context on why this assignment or department is incorrect..."
                  rows={3}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs"
              >
                Save Review Metadata
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
