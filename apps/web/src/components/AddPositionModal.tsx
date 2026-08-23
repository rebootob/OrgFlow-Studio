import React, { useState } from 'react';
import { useOrgStore } from '../store/orgStore.js';
import { OrgUnit } from '@orgflow/domain';
import { Briefcase, X } from 'lucide-react';

interface AddPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgUnit: OrgUnit | null;
}

export const AddPositionModal: React.FC<AddPositionModalProps> = ({
  isOpen,
  onClose,
  orgUnit
}) => {
  const { addPosition } = useOrgStore();
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');

  if (!isOpen || !orgUnit) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addPosition({
      orgUnitCode: orgUnit.code,
      title: title.trim(),
      code: code.trim() || undefined
    });

    setTitle('');
    setCode('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 text-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">Add Position</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <span className="text-slate-500">Department / Unit: </span>
          <strong className="text-slate-900">{orgUnit.code} ({orgUnit.name})</strong>
        </div>

        <form onSubmit={handleCreate} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Position Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Project Specialist"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Position Code (Optional)</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Auto-generated if blank (e.g. POS-802)"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold"
            >
              Create Position in Draft
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
