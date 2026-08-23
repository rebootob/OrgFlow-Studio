import React, { useState } from 'react';
import { useOrgStore } from '../store/orgStore.js';
import { OrgUnit } from '@orgflow/domain';
import { PlusCircle, AlertTriangle, X } from 'lucide-react';

interface AddOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentUnit: OrgUnit | null;
}

export const AddOrgModal: React.FC<AddOrgModalProps> = ({
  isOpen,
  onClose,
  parentUnit
}) => {
  const { addOrgUnit } = useOrgStore();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState('SECTION');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !parentUnit) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setErrorMessage('Please fill in both Unit Name and Unit Code.');
      return;
    }

    const res = addOrgUnit({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      type,
      parentCode: parentUnit.code
    });

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to create unit.');
    } else {
      setName('');
      setCode('');
      setErrorMessage(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 text-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">Add Child Organization Unit</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <span className="text-slate-500">Parent Unit: </span>
          <strong className="text-slate-900">{parentUnit.code} ({parentUnit.name})</strong>
        </div>

        <form onSubmit={handleCreate} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Organization Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sales Engineering Team 2"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Organization Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. TMF4"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:border-indigo-500 font-mono"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Unit Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:border-indigo-500"
              >
                <option value="DEPARTMENT">Department</option>
                <option value="SECTION">Section</option>
                <option value="TEAM">Team</option>
                <option value="SUB-TEAM">Sub-Team</option>
                <option value="FUNCTION">Function</option>
              </select>
            </div>
          </div>

          {errorMessage && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

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
              Add Unit in Draft
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
