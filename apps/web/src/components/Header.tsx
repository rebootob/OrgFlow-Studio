import React from 'react';
import { useOrgStore } from '../store/orgStore.js';
import {
  GitBranch,
  Undo2,
  Redo2,
  Printer,
  GitCompare,
  Save,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

interface HeaderProps {
  onOpenCompare: () => void;
  onOpenPrint: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCompare, onOpenPrint }) => {
  const {
    planName,
    currentVersionName,
    undoStack,
    redoStack,
    undo,
    redo,
    saveNamedVersion,
    versions,
    loadVersionSnapshot,
    compareWithVersion,
    validationResult,
    initializeBaseline
  } = useOrgStore();

  const handleCreateNamedVersion = () => {
    const nextVerNum = `V${versions.size + 1}`;
    const name = window.prompt(`Enter Named Version tag:`, nextVerNum);
    if (name) {
      saveNamedVersion(name.trim());
      alert(`Immutable snapshot created for ${name.trim()}!`);
    }
  };

  const handleCompareClick = () => {
    if (versions.size === 0) {
      alert('Please create at least one named version (e.g., V1) before comparing!');
      return;
    }
    const verList = Array.from(versions.keys());
    const target = verList[verList.length - 1];
    compareWithVersion(target);
    onOpenCompare();
  };

  return (
    <header className="h-16 bg-slate-900/90 border-b border-slate-800 px-6 flex items-center justify-between backdrop-blur-md select-none">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950">
            <GitBranch className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-white">OrgFlow Studio</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                Spike Prototype
              </span>
            </div>
            <div className="text-xs text-slate-400 font-medium truncate max-w-[280px]">
              {planName}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pl-4 border-l border-slate-800">
          <span className="text-xs text-slate-400">Version:</span>
          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 border border-slate-700 text-emerald-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {currentVersionName}
          </span>
          {versions.size > 0 && (
            <select
              onChange={(e) => {
                if (e.target.value === 'CURRENT') {
                  initializeBaseline();
                } else {
                  loadVersionSnapshot(e.target.value);
                }
              }}
              className="bg-slate-800 text-slate-200 text-xs px-2 py-1 rounded border border-slate-700 outline-none"
            >
              <option value="CURRENT">Working Draft</option>
              {Array.from(versions.keys()).map(v => (
                <option key={v} value={v}>Snapshot {v}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
          <button
            onClick={undo}
            disabled={undoStack.length === 0}
            title="Undo last change"
            className="p-1.5 rounded hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 transition-colors"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={redoStack.length === 0}
            title="Redo change"
            className="p-1.5 rounded hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 transition-colors"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={handleCreateNamedVersion}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <Save className="w-3.5 h-3.5 text-blue-400" />
          Snapshot Version
        </button>

        <button
          onClick={handleCompareClick}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <GitCompare className="w-3.5 h-3.5 text-purple-400" />
          Compare Diff
        </button>

        <button
          onClick={onOpenPrint}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition-colors"
        >
          <Printer className="w-3.5 h-3.5" />
          Print Package
        </button>

        <div className="pl-3 border-l border-slate-800 flex items-center gap-1.5 text-xs">
          {validationResult.valid ? (
            <div className="flex items-center gap-1 text-emerald-400 font-semibold px-2 py-1 bg-emerald-950/60 border border-emerald-800/80 rounded-md">
              <ShieldCheck className="w-4 h-4" />
              <span>100% HEALTHY</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-rose-400 font-semibold px-2 py-1 bg-rose-950/60 border border-rose-800/80 rounded-md">
              <AlertTriangle className="w-4 h-4" />
              <span>{validationResult.errors.length} ERRORS</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
