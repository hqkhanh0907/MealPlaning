import { ChevronDown, Dumbbell, Trophy } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/skeleton';

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  bestWeight: number;
  bestReps: number;
  date: string;
  history?: Array<{ weight: number; reps: number; date: string }>;
}

export interface PersonalRecordsProps {
  records: PersonalRecord[];
  isLoading?: boolean;
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

const MAX_HISTORY = 5;

function PersonalRecordsInner({ records, isLoading }: Readonly<PersonalRecordsProps>) {
  const { t } = useTranslation();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const hasHistory = (rec: PersonalRecord) => rec.history && rec.history.length > 0;

  return (
    <div data-testid="personal-records" className="bg-card rounded-xl p-4 shadow-sm">
      <h3 data-testid="pr-title" className="mb-3 text-base font-semibold">
        {t('fitness.personalRecords.title')}
      </h3>

      {isLoading && (
        <div data-testid="pr-loading" className="space-y-3">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      )}
      {!isLoading && records.length === 0 && (
        <div data-testid="pr-empty-state" className="text-muted-foreground flex flex-col items-center gap-2 py-8">
          <Dumbbell className="h-10 w-10" aria-hidden="true" />
          <p className="font-medium">{t('fitness.personalRecords.empty')}</p>
          <p className="text-sm">{t('fitness.personalRecords.emptyDescription')}</p>
        </div>
      )}
      {!isLoading && records.length > 0 && (
        <ul className="space-y-2">
          {records.map(rec => {
            const expanded = expandedIds.has(rec.exerciseId);
            const historySlice = rec.history?.slice(0, MAX_HISTORY) ?? [];

            return (
              <li key={rec.exerciseId} data-testid={`pr-item-${rec.exerciseId}`} className="rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Trophy
                    data-testid={`pr-trophy-${rec.exerciseId}`}
                    className="text-energy h-5 w-5 shrink-0"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{rec.exerciseName}</p>
                    <div className="flex items-baseline gap-1 text-sm">
                      <span data-testid={`pr-weight-${rec.exerciseId}`} className="text-energy font-semibold">
                        {rec.bestWeight}
                        {t('fitness.personalRecords.kgUnit')}
                      </span>
                      <span data-testid={`pr-reps-${rec.exerciseId}`}>
                        {t('fitness.personalRecords.repsFormat', { reps: rec.bestReps })}
                      </span>
                    </div>
                  </div>
                  <span data-testid={`pr-date-${rec.exerciseId}`} className="text-muted-foreground shrink-0 text-xs">
                    {formatDate(rec.date)}
                  </span>
                  {hasHistory(rec) && (
                    <button
                      data-testid={`pr-toggle-${rec.exerciseId}`}
                      aria-expanded={expanded}
                      onClick={() => toggleExpand(rec.exerciseId)}
                      className="hover:bg-accent shrink-0 rounded-md p-1 transition-colors"
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                      />
                    </button>
                  )}
                </div>

                {expanded && historySlice.length > 0 && (
                  <div data-testid={`pr-history-${rec.exerciseId}`} className="mt-2 border-t pt-2">
                    <p className="text-muted-foreground mb-1 text-xs font-medium">
                      {t('fitness.personalRecords.historyLabel')}
                    </p>
                    <ul className="space-y-1">
                      {historySlice.map((entry, i) => (
                        <li
                          key={`${entry.date}-${i}`}
                          data-testid={`pr-history-entry-${i}`}
                          className="text-muted-foreground flex items-center justify-between text-xs"
                        >
                          <span>
                            {entry.weight}
                            {t('fitness.personalRecords.kgUnit')}{' '}
                            {t('fitness.personalRecords.repsFormat', { reps: entry.reps })}
                          </span>
                          <span>{formatDate(entry.date)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const PersonalRecords = React.memo(PersonalRecordsInner);
PersonalRecords.displayName = 'PersonalRecords';

export default PersonalRecords;
