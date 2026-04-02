import { Check, Moon, Plus, Sun, Sunset, Trash2, X } from 'lucide-react';
import React, { memo, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { TrainingPlanDay } from '../types';

interface SessionTabsProps {
  sessions: TrainingPlanDay[];
  activeSessionId: string;
  completedSessionIds: string[];
  onSelectSession: (sessionId: string) => void;
  onAddSession: () => void;
  onDeleteSession?: (dayId: string) => void;
  maxSessions?: number;
}

const SESSION_ICONS = [Sun, Moon, Sunset] as const;
const LONG_PRESS_MS = 500;

function SessionTabsInner({
  sessions,
  activeSessionId,
  completedSessionIds,
  onSelectSession,
  onAddSession,
  onDeleteSession,
  maxSessions = 3,
}: Readonly<SessionTabsProps>): React.JSX.Element | null {
  const { t } = useTranslation();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSelect = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const id = e.currentTarget.dataset.sessionId;
      if (id) onSelectSession(id);
    },
    [onSelectSession],
  );

  const canDelete = sessions.length > 1 && !!onDeleteSession;

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!canDelete) return;
      const id = e.currentTarget.dataset.sessionId;
      if (!id) return;
      clearLongPress();
      longPressTimerRef.current = setTimeout(() => {
        setConfirmDeleteId(id);
      }, LONG_PRESS_MS);
    },
    [canDelete, clearLongPress],
  );

  const handlePointerUpOrLeave = useCallback(() => {
    clearLongPress();
  }, [clearLongPress]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!canDelete) return;
      e.preventDefault();
      const id = e.currentTarget.dataset.sessionId;
      if (id) setConfirmDeleteId(id);
    },
    [canDelete],
  );

  const handleConfirmDelete = useCallback(() => {
    if (confirmDeleteId && onDeleteSession) {
      onDeleteSession(confirmDeleteId);
    }
    setConfirmDeleteId(null);
  }, [confirmDeleteId, onDeleteSession]);

  const handleCancelDelete = useCallback(() => {
    setConfirmDeleteId(null);
  }, []);

  if (sessions.length === 0) return null;

  const isMaxReached = sessions.length >= maxSessions;

  return (
    <div className="px-1 py-2">
      <div className="flex items-center gap-2">
        <div role="tablist" aria-label={t('fitness.plan.sessionTabs')} className="flex items-center gap-2">
          {sessions.map((session, index) => {
            const isActive = session.id === activeSessionId;
            const isCompleted = completedSessionIds.includes(session.id);
            const Icon = SESSION_ICONS[index] ?? Sun;

            return (
              <button
                key={session.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                data-completed={isCompleted ? 'true' : undefined}
                data-session-id={session.id}
                onClick={handleSelect}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUpOrLeave}
                onPointerLeave={handlePointerUpOrLeave}
                onContextMenu={handleContextMenu}
                className={`flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-full px-4 py-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none active:scale-[0.97] motion-reduce:transform-none ${
                  isActive
                    ? 'bg-emerald-500 text-white dark:bg-emerald-600'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Icon className="h-4 w-4" aria-hidden="true" />
                )}
                {t('fitness.plan.sessionTab', { order: session.sessionOrder })}
                {isActive && canDelete && (
                  <button
                    type="button"
                    data-testid={`delete-session-${session.id}`}
                    onClick={e => {
                      e.stopPropagation();
                      setConfirmDeleteId(session.id);
                    }}
                    aria-label={t('fitness.plan.deleteSession')}
                    className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/30 text-current transition-colors hover:bg-white/50 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </button>
            );
          })}
        </div>

        <button
          data-testid="add-session-tab"
          type="button"
          disabled={isMaxReached}
          onClick={onAddSession}
          aria-label={t('fitness.plan.addSession')}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-3 text-slate-400 transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-700"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {confirmDeleteId !== null && (
        <div
          data-testid="delete-session-confirm"
          role="alertdialog"
          aria-label={t('fitness.plan.deleteSessionConfirm')}
          className="mt-2 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 dark:bg-red-900/20"
        >
          <Trash2 className="text-destructive h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="text-sm text-red-700 dark:text-red-300">{t('fitness.plan.deleteSessionConfirm')}</span>
          <button
            data-testid="confirm-delete-session"
            type="button"
            onClick={handleConfirmDelete}
            aria-label={t('fitness.plan.deleteSession')}
            className="ml-auto min-h-[44px] min-w-[44px] rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
          >
            <Trash2 className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
            {t('fitness.plan.delete')}
          </button>
          <button
            data-testid="cancel-delete-session"
            type="button"
            onClick={handleCancelDelete}
            autoFocus
            aria-label={t('fitness.plan.cancelDelete')}
            className="min-h-[44px] min-w-[44px] rounded-md bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-300 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500"
          >
            {t('fitness.plan.cancelDelete')}
          </button>
        </div>
      )}
    </div>
  );
}

export const SessionTabs = memo(SessionTabsInner);
SessionTabs.displayName = 'SessionTabs';
