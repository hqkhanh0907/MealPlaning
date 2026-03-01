import React, { useRef, useState } from 'react';
import { Download, Upload, Loader2 } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';

interface DataBackupProps {
  onImport: (data: Record<string, unknown>) => void;
}

const EXPORT_KEYS = ['mp-ingredients', 'mp-dishes', 'mp-day-plans', 'mp-user-profile'];

export const DataBackup: React.FC<DataBackupProps> = ({ onImport }) => {
  const notify = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = () => {
    try {
      const data: Record<string, unknown> = {};
      for (const key of EXPORT_KEYS) {
        const value = localStorage.getItem(key);
        if (value) {
          data[key] = JSON.parse(value);
        }
      }

      data._exportedAt = new Date().toISOString();
      data._version = '1.0';

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meal-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      notify.success('Xuất dữ liệu thành công!', 'File backup đã được tải xuống.');
    } catch {
      notify.error('Xuất thất bại', 'Không thể xuất dữ liệu. Vui lòng thử lại.');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const text = await file.text();
      const data = JSON.parse(text) as Record<string, unknown>;

      // Validate: must have at least one expected key
      const hasValidKeys = EXPORT_KEYS.some(key => key in data);
      if (!hasValidKeys) {
        notify.error('File không hợp lệ', 'File backup không chứa dữ liệu hợp lệ.');
        return;
      }

      onImport(data);
      notify.success('Nhập dữ liệu thành công!', 'Dữ liệu đã được khôi phục. Trang sẽ tải lại.');

      // Reload after a short delay to apply changes
      setTimeout(() => globalThis.location.reload(), 1500);
    } catch {
      notify.error('Nhập thất bại', 'File không đúng định dạng JSON. Vui lòng kiểm tra lại.');
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
      <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">Sao lưu & Khôi phục</h4>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Xuất hoặc nhập dữ liệu dạng JSON để sao lưu.</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleExport}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 active:scale-[0.98] transition-all min-h-11"
        >
          <Download className="w-4 h-4" />
          Xuất dữ liệu
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-xl font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 active:scale-[0.98] transition-all disabled:opacity-50 min-h-11"
        >
          {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Nhập dữ liệu
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImport}
          accept=".json"
          className="hidden"
        />
      </div>
    </div>
  );
};
