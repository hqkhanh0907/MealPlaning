import { loadLeptosModule } from '../../core/leptos-module';
import type { PendingMealTarget } from '../../core/stores/calendar.store';

export type DashboardAction =
  | {
      type:
        | 'refresh'
        | 'addMeal'
        | 'generateDailyInsight'
        | 'analyzeMealPhoto'
        | 'enterPhotoMealManually'
        | 'cancelPhoto'
        | 'savePhoto';
    }
  | { type: 'openPendingMeal'; target: PendingMealTarget }
  | { type: 'navigate'; route: string }
  | { type: 'selectPhotoMeal'; value: string }
  | { type: 'setPhotoIncluded'; index: number; checked: boolean }
  | { type: 'setPhotoName'; index: number; value: string }
  | { type: 'setPhotoGrams'; index: number; value: number | null };

export interface DashboardHandle {
  update(json: string): void;
  focusResult(result: 'insight' | 'photo'): void;
  free(): void;
}

interface Renderer {
  default(): Promise<unknown>;
  mountDashboard(
    body: HTMLElement,
    footer: HTMLElement,
    json: string,
    dispatch: (action: DashboardAction) => void,
  ): DashboardHandle;
}

export function loadDashboardRenderer(): Promise<Renderer> {
  return loadLeptosModule() as Promise<Renderer>;
}
