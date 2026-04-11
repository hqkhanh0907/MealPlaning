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
const SESSION_ICON_COLORS = ['text-energy', 'text-info', 'text-energy'] as const;
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
              <div key={session.id} className="flex items-center gap-1">
                <button
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
                  className={`focus-visible:ring-ring flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-full px-4 py-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none active:scale-[0.97] motion-reduce:transform-none ${
                    isActive
                      ? 'bg-accent-highlight text-accent-highlight-foreground dark:bg-accent-highlight'
                      : 'text-foreground-secondary bg-muted'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Icon
                      className={`h-4 w-4 ${isActive ? '' : (SESSION_ICON_COLORS[index] ?? '')}`}
                      aria-hidden="true"
                    />
                  )}
                  {t('fitness.plan.sessionTab', { order: session.sessionOrder })}
                </button>
                {isActive && canDelete && (
                  <button
                    type="button"
                    data-testid={`delete-session-${session.id}`}
                    onClick={() => setConfirmDeleteId(session.id)}
                    aria-label={t('fitness.plan.deleteSession')}
                    className="text-muted-foreground hover:bg-accent flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button
          data-testid="add-session-tab"
          type="button"
          disabled={isMaxReached}
          onClick={onAddSession}
          aria-label={t('fitness.plan.addSession')}
          className="focus-visible:ring-ring text-muted-foreground hover:bg-accent flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-3 transition-colors focus-visible:ring-2 focus-visible:outline-none active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {confirmDeleteId !== null && (
        <div
          data-testid="delete-session-confirm"
          role="alertdialog"
          aria-label={t('fitness.plan.deleteSessionConfirm')}
          className="bg-destructive/10 mt-2 flex items-center gap-2 rounded-lg px-3 py-2"
        >
          <Trash2 className="text-destructive h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="text-destructive text-sm">{t('fitness.plan.deleteSessionConfirm')}</span>
          <button
            data-testid="confirm-delete-session"
            type="button"
            onClick={handleConfirmDelete}
            aria-label={t('fitness.plan.deleteSession')}
            className="focus-visible:ring-ring bg-destructive hover:bg-destructive/90 text-destructive-foreground ml-auto min-h-[44px] min-w-[44px] rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
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
            className="focus-visible:ring-ring bg-muted text-foreground hover:bg-accent min-h-[44px] min-w-[44px] rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
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
