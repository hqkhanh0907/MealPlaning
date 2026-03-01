import React from 'react';
import { Edit3, X } from 'lucide-react';

interface DetailModalProps {
  title: string;
  editLabel: string;
  onClose: () => void;
  onEdit: () => void;
  children: React.ReactNode;
}

export const DetailModal: React.FC<DetailModalProps> = ({ title, editLabel, onClose, onEdit, children }) => (
  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-60">
    <button type="button" aria-label="Close modal" className="absolute inset-0 w-full h-full cursor-default" onClick={onClose} tabIndex={-1} />
    <div className="relative bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-md overflow-hidden max-h-[90vh] overflow-y-auto sm:mx-4">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{title}</h4>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-full text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
            title="Chỉnh sửa"
          >
            <Edit3 className="w-5 h-5" />
          </button>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 dark:text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-5">
        {children}
      </div>

      {/* Footer */}
      <div className="px-6 pb-6">
        <button
          onClick={onEdit}
          className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
        >
          <Edit3 className="w-5 h-5" /> {editLabel}
        </button>
      </div>
    </div>
  </div>
);

