import React from 'react';
import { Save } from 'lucide-react';
import { useModalBackHandler } from '../../hooks/useModalBackHandler';

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({ isOpen, onSave, onDiscard, onCancel }) => {
  useModalBackHandler(isOpen, onCancel);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-70">
      <button type="button" aria-label="Close dialog" className="absolute inset-0 w-full h-full cursor-default" onClick={onCancel} tabIndex={-1} />
      <div className="relative bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-sm overflow-hidden sm:mx-4">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Save className="w-8 h-8" />
          </div>
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xl mb-2">Thay đổi chưa lưu</h4>
          <p className="text-slate-600 dark:text-slate-400 mb-6">Bạn có muốn lưu các thay đổi trước khi quay lại?</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={onSave}
              className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold hover:bg-emerald-600 active:scale-[0.98] transition-all min-h-12"
            >
              Lưu & quay lại
            </button>
            <button
              onClick={onDiscard}
              className="w-full py-3 rounded-xl font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 active:scale-[0.98] transition-all min-h-12"
            >
              Bỏ thay đổi
            </button>
            <button
              onClick={onCancel}
              className="w-full py-3 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-[0.98] transition-all min-h-12"
            >
              Ở lại chỉnh sửa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

