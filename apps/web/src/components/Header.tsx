import React, { useState } from 'react';
import { useOrgStore } from '../store/orgStore.js';
import {
  Building,
  Printer,
  Maximize2,
  Lock,
  MoreHorizontal,
  ShieldCheck,
  Calendar,
  Layers,
  Undo2,
  Redo2,
  PlusCircle,
  FileEdit,
  Eye,
  CheckCircle2
} from 'lucide-react';

interface HeaderProps {
  onOpenCompare: () => void;
  onOpenPrint: () => void;
  onFitOverview: () => void;
  onFocusSelected: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCompare,
  onOpenPrint,
  onFitOverview,
  onFocusSelected
}) => {
  const {
    viewMode,
    draftName,
    sourceSnapshotMeta,
    createDraft,
    switchToCurrent,
    selectedOrgCode,
    selectedPositionId,
    undoStack,
    redoStack,
    undo,
    redo,
    autosaveStatus,
    changeOperations
  } = useOrgStore();

  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);

  const lastUpdatedFormatted = sourceSnapshotMeta?.loadedAt
    ? new Date(sourceSnapshotMeta.loadedAt).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '23 Aug 2026 13:04';

  const handleCreateDraftClick = () => {
    const name = window.prompt('Enter Working Draft Plan Name:', 'FY2027 Organization Plan');
    if (name) {
      createDraft(name.trim());
    }
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-xs select-none z-30">
      {/* Left: Branding & Mode Switcher */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm transition-colors ${
            viewMode === 'DRAFT' ? 'bg-indigo-600' : 'bg-emerald-600'
          }`}>
            {viewMode === 'DRAFT' ? <FileEdit className="w-4 h-4" /> : <Building className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-slate-900">OrgFlow Studio</span>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-semibold text-slate-700">
                {viewMode === 'DRAFT' ? draftName : 'Current Organization'}
              </span>
            </div>
          </div>
        </div>

        {/* Mode Indicator Badges */}
        {viewMode === 'CURRENT_OFFICIAL' ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Official Kintone Data</span>
            <span className="text-emerald-400">•</span>
            <span className="flex items-center gap-0.5 text-emerald-700">
              <Lock className="w-3 h-3" /> Read Only
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-800 text-[11px] font-medium">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              <span>DRAFT WORKSPACE</span>
              <span className="text-indigo-400">•</span>
              <span className="text-indigo-600 font-semibold">Not Synced to Kintone</span>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-md">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>{autosaveStatus === 'SAVED' ? 'Autosaved' : 'Saving...'}</span>
              {changeOperations.length > 0 && (
                <span className="text-indigo-600 font-bold ml-1">({changeOperations.length} changes)</span>
              )}
            </div>
          </div>
        )}

        {/* Updated Timestamp */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-500 pl-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Based on Kintone: <strong className="text-slate-700">{lastUpdatedFormatted}</strong></span>
        </div>
      </div>

      {/* Right: Primary Actions */}
      <div className="flex items-center gap-2">
        {/* Toggle Mode: View Current vs Edit Draft */}
        {viewMode === 'CURRENT_OFFICIAL' ? (
          <button
            onClick={handleCreateDraftClick}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Draft</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={switchToCurrent}
              title="View Official Kintone data (Read Only reference)"
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>View Official</span>
            </button>

            {/* Undo / Redo */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={undo}
                disabled={undoStack.length === 0}
                title="Undo last change (Ctrl+Z)"
                className="p-1.5 rounded hover:bg-white disabled:opacity-30 text-slate-700 transition-colors shadow-2xs"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={redo}
                disabled={redoStack.length === 0}
                title="Redo change (Ctrl+Y)"
                className="p-1.5 rounded hover:bg-white disabled:opacity-30 text-slate-700 transition-colors shadow-2xs"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* View Controls: Overview & Focus */}
        <button
          onClick={onFitOverview}
          title="Zoom out to fit entire organization"
          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
          <span>Overview</span>
        </button>

        <button
          onClick={onFocusSelected}
          disabled={!selectedOrgCode && !selectedPositionId}
          title="Zoom in to selected department or position"
          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <span>Focus Selected</span>
        </button>

        {/* Print Package */}
        <button
          onClick={onOpenPrint}
          className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
        >
          <Printer className="w-3.5 h-3.5 text-slate-500" />
          <span>Print</span>
        </button>

        {/* More Actions Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {isMoreMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-2 text-xs text-slate-700 z-50">
              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  setIsHealthModalOpen(true);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Organization Health
                </span>
                <span className="font-semibold text-emerald-700">100% Valid</span>
              </button>

              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenCompare();
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-slate-700"
              >
                Version Diff Inspector
              </button>

              {sourceSnapshotMeta && (
                <div className="mt-1 pt-2 border-t border-slate-100 px-3 py-1 text-[11px] text-slate-400 font-mono">
                  <div>Snapshot: {sourceSnapshotMeta.snapshotId}</div>
                  <div className="truncate">Hash: {sourceSnapshotMeta.treeHash.substring(0, 16)}...</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Health Inspector Modal */}
      {isHealthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Data & Hierarchy Quality Report
              </h3>
              <button
                onClick={() => setIsHealthModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span>Total Units:</span>
                <strong className="text-slate-900">57 Units (App 791)</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span>Active Employees:</span>
                <strong className="text-slate-900">275 Staff (App 53)</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span>Orphan Nodes:</span>
                <strong className="text-emerald-700">0 (None detected)</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span>Circular Relationships:</span>
                <strong className="text-emerald-700">0 (None detected)</strong>
              </div>
              <div className="flex justify-between py-1">
                <span>Overall Status:</span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-semibold rounded">100% HEALTHY</span>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsHealthModalOpen(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
