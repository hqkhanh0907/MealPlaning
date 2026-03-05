/**
 * TranslateStatusBadge.tsx
 * A small floating badge that shows background translation progress.
 * Visible only when there are pending/running jobs or models are loading.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages, CheckCircle2 } from 'lucide-react';
import { useTranslateQueue } from '../services/translateQueueService';

const AUTO_HIDE_MS = 3000; // hide "done" badge after 3s

export const TranslateStatusBadge: React.FC = () => {
  const { t } = useTranslation();
  const workerReady = useTranslateQueue((s) => s.workerReady);
  const jobs = useTranslateQueue((s) => s.jobs);

  const pendingCount = jobs.filter(
    (j) => j.status === 'pending' || j.status === 'running',
  ).length;

  const [showDone, setShowDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPendingRef = useRef(pendingCount);

  // When pending transitions from >0 to 0 (and worker is ready), show "done" briefly
  useEffect(() => {
    const prev = prevPendingRef.current;
    prevPendingRef.current = pendingCount;
    if (workerReady && prev > 0 && pendingCount === 0) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setShowDone(true), 0);
      timerRef.current = setTimeout(() => setShowDone(false), AUTO_HIDE_MS);
    }
  }, [pendingCount, workerReady]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  // Not loading and nothing to show → render nothing
  if (!workerReady && pendingCount === 0) return null;
  if (workerReady && pendingCount === 0 && !showDone) return null;

  const badgeContent = (() => {
    if (workerReady && pendingCount === 0 && showDone) {
      return (
        <>
          <CheckCircle2 className="w-4 h-4" />
          <span>{t('translate.done')}</span>
        </>
      );
    }
    if (!workerReady) {
      return (
        <>
          <Languages className="w-4 h-4 animate-pulse text-blue-500" />
          <span className="text-slate-500 dark:text-slate-400">{t('translate.loadingModels')}</span>
        </>
      );
    }
    return (
      <>
        <Languages className="w-4 h-4 animate-spin text-emerald-500" />
        <span>{t('translate.translating', { count: pendingCount })}</span>
      </>
    );
  })();

  const isDone = workerReady && pendingCount === 0 && showDone;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="translate-status-badge"
      className={`
        fixed bottom-20 sm:bottom-6 right-4 sm:right-6
        flex items-center gap-2 px-3 py-2
        rounded-full shadow-lg text-sm font-medium
        transition-all duration-300 z-50
        ${
          isDone
            ? 'bg-emerald-500 text-white'
            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
        }
      `}
    >
      {badgeContent}
    </div>
  );
};
