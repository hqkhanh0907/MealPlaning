import React, { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Sunset, Plus, Check } from 'lucide-react';
import type { TrainingPlanDay } from '../types';

interface SessionTabsProps {
  sessions: TrainingPlanDay[];
  activeSessionId: string;
  completedSessionIds: string[];
  onSelectSession: (sessionId: string) => void;
  onAddSession: () => void;
  maxSessions?: number;
}

const SESSION_ICONS = [Sun, Moon, Sunset] as const;

function SessionTabsInner({
  sessions,
  activeSessionId,
  completedSessionIds,
  onSelectSession,
  onAddSession,
  maxSessions = 3,
}: SessionTabsProps): React.JSX.Element | null {
  const { t } = useTranslation();

  const handleSelect = useCallback(
    (id: string) => () => onSelectSession(id),
    [onSelectSession],
  );

  if (sessions.length === 0) return null;

  const isMaxReached = sessions.length >= maxSessions;

  return (
    <div
      role="tablist"
      aria-label={t('fitness.plan.addSession')}
      className="flex items-center gap-2 px-1 py-2"
    >
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
            onClick={handleSelect(session.id)}
            className={`flex items-center gap-1.5 rounded-full py-3 px-4 text-sm font-medium transition-colors active:scale-[0.97] ${
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
          </button>
        );
      })}

      <button
        data-testid="add-session-tab"
        role="tab"
        type="button"
        aria-selected={false}
        disabled={isMaxReached}
        onClick={onAddSession}
        aria-label={t('fitness.plan.addSession')}
        className="flex items-center justify-center rounded-full p-3 text-slate-400 transition-colors hover:bg-slate-100 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed dark:hover:bg-slate-700"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

export const SessionTabs = memo(SessionTabsInner);
SessionTabs.displayName = 'SessionTabs';
