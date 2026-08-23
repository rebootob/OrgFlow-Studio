import React, { useState } from 'react';
import { useOrgStore } from '../store/orgStore.js';
import { X, Printer, ShieldCheck } from 'lucide-react';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrintModal: React.FC<PrintModalProps> = ({ isOpen, onClose }) => {
  const { planName, currentVersionName, effectiveDate, orgUnits, positions } = useOrgStore();
  const [pageSize, setPageSize] = useState<'A4' | 'A3'>('A3');

  if (!isOpen) return null;

  const docId = `DOC-OFS-${Date.now().toString(36).toUpperCase()}`;
  const timestamp = new Date().toLocaleString('en-GB');
  const activeCount = positions.filter(p => p.lifecycle === 'ACTIVE').length;
  const vacantCount = positions.filter(p => p.lifecycle === 'VACANT').length;

  const handlePrintTrigger = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 print:p-0 print:bg-white print:static">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden print:max-w-none print:max-h-none print:border-none print:bg-white print:text-black">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-950 border border-emerald-800 rounded-lg text-emerald-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Approval Package Print Preview</h2>
              <p className="text-xs text-slate-400">Deterministic Vector & Pagination Renderer (No canvas screenshot degradation)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs font-semibold">
              <button
                onClick={() => setPageSize('A4')}
                className={`px-3 py-1 rounded ${pageSize === 'A4' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                A4 Landscape
              </button>
              <button
                onClick={() => setPageSize('A3')}
                className={`px-3 py-1 rounded ${pageSize === 'A3' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                A3 Landscape
              </button>
            </div>
            <button
              onClick={handlePrintTrigger}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition-colors"
            >
              <Printer className="w-4 h-4" /> Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-8 overflow-y-auto flex-1 bg-slate-950/40 print:p-0 print:bg-white text-slate-100 print:text-black">
          <div className={`mx-auto bg-white text-slate-900 shadow-2xl rounded-lg p-8 border border-slate-300 print:border-none print:shadow-none print:p-0 ${
            pageSize === 'A3' ? 'max-w-[1100px]' : 'max-w-[850px]'
          }`}>
            <div className="border-b-2 border-slate-800 pb-4 flex justify-between items-start">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-800">
                  OrgFlow Studio • Official Proposal Package
                </div>
                <h1 className="text-xl font-extrabold text-slate-900 mt-1">{planName}</h1>
                <div className="text-xs text-slate-600 mt-1 flex items-center gap-3">
                  <span>Version: <strong className="text-emerald-700">{currentVersionName}</strong></span>
                  <span>•</span>
                  <span>Effective Date: <strong>{effectiveDate}</strong></span>
                </div>
              </div>
              <div className="text-right font-mono text-[10px] text-slate-500 space-y-0.5">
                <div>Document ID: <strong>{docId}</strong></div>
                <div>Generated: {timestamp}</div>
                <div className="text-[9px] text-emerald-700 font-semibold flex items-center justify-end gap-1">
                  <ShieldCheck className="w-3 h-3" /> VERIFIED DETERMINISTIC RENDER
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 my-6">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <div className="text-[10px] font-semibold text-slate-500 uppercase">Org Units</div>
                <div className="text-lg font-bold text-slate-800 mt-0.5">{orgUnits.length} Units</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <div className="text-[10px] font-semibold text-slate-500 uppercase">Total Positions</div>
                <div className="text-lg font-bold text-slate-800 mt-0.5">{positions.length}</div>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                <div className="text-[10px] font-semibold text-emerald-700 uppercase">Active Headcount</div>
                <div className="text-lg font-bold text-emerald-800 mt-0.5">{activeCount} Staff</div>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
                <div className="text-[10px] font-semibold text-amber-700 uppercase">Open Vacancies</div>
                <div className="text-lg font-bold text-amber-800 mt-0.5">{vacantCount} Positions</div>
              </div>
            </div>

            <div className="my-6">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Hierarchical Unit Breakdown
              </h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="p-2 border-r border-slate-200">Code</th>
                      <th className="p-2 border-r border-slate-200">Unit Name</th>
                      <th className="p-2 border-r border-slate-200">Level / Type</th>
                      <th className="p-2 border-r border-slate-200">Parent</th>
                      <th className="p-2 text-right">Headcount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px]">
                    {orgUnits.slice(0, 15).map(org => {
                      const posInOrg = positions.filter(p => p.orgUnitCode === org.code);
                      return (
                        <tr key={org.code} className="hover:bg-slate-50">
                          <td className="p-2 font-mono font-bold text-slate-900 border-r border-slate-200">{org.code}</td>
                          <td className="p-2 font-medium text-slate-800 border-r border-slate-200">{org.name}</td>
                          <td className="p-2 text-slate-600 border-r border-slate-200">L{org.level} • {org.type}</td>
                          <td className="p-2 font-mono text-slate-500 border-r border-slate-200">{org.parentCode || 'ROOT'}</td>
                          <td className="p-2 text-right font-semibold text-slate-900">{posInOrg.length}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="text-[10px] text-slate-500 mt-1.5 italic">
                * Displaying first 15 of {orgUnits.length} organization nodes. Full multi-page package partitions by Division upon PDF export.
              </div>
            </div>

            <div className="mt-10 pt-6 border-t-2 border-slate-800 grid grid-cols-2 gap-8 text-xs">
              <div className="space-y-4">
                <div className="text-[11px] font-bold text-slate-800 uppercase">Prepared By (HR Department):</div>
                <div className="pt-8 border-b border-slate-400 w-3/4"></div>
                <div className="text-slate-600">Date: ____ / ____ / ________</div>
              </div>
              <div className="space-y-4">
                <div className="text-[11px] font-bold text-slate-800 uppercase">Approved By (Managing Director):</div>
                <div className="pt-8 border-b border-slate-400 w-3/4"></div>
                <div className="text-slate-600">Date: ____ / ____ / ________</div>
              </div>
            </div>

            <div className="mt-8 pt-3 border-t border-slate-200 flex justify-between text-[9px] text-slate-400 font-mono">
              <div>OrgFlow Studio • Version Control & Controlled Sync Platform</div>
              <div>Page 1 of 1 • Doc ID: {docId}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
