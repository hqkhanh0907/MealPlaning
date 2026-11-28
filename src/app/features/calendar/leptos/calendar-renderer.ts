import type { MealType } from '../../../core/models/meal-plan.types';

export type CalendarAction =
  | {
      type:
        | 'datePicker'
        | 'toggleView'
        | 'copyWeek'
        | 'plan'
        | 'copyYesterday'
        | 'ai'
        | 'undo'
        | 'dismissUndo';
    }
  | { type: 'weekNav'; delta: -7 | 7 }
  | { type: 'weekDay'; date: string }
  | { type: 'add'; meal: MealType }
  | { type: 'mark' | 'unmark'; id: string }
  | { type: 'options'; id: string; meal: MealType };

export interface CalendarHandle {
  update(json: string): void;
  focusPending(meal: MealType, id: string): boolean;
  free(): void;
}
interface CalendarRenderer {
  default(): Promise<void>;
  mountCalendar(
    controls: HTMLElement,
    body: HTMLElement,
    undo: HTMLElement,
    json: string,
    dispatch: (a: CalendarAction) => void,
  ): CalendarHandle;
}
let pending: Promise<CalendarRenderer> | undefined;
export function loadCalendarRenderer(): Promise<CalendarRenderer> {
  if (!pending) {
    const url = new URL('assets/leptos/healthmate_dashboard.js', document.baseURI);
    pending = import(/* webpackIgnore: true */ /* @vite-ignore */ url.href)
      .then(async (module: CalendarRenderer) => {
        await module.default();
        if (typeof module.mountCalendar !== 'function')
          throw new Error('Calendar renderer missing');
        return module;
      })
      .catch((error: unknown) => {
        pending = undefined;
        throw error;
      });
  }
  return pending;
}
export async function loadCalendarPage() {
  try {
    await loadCalendarRenderer();
    return (await import('./calendar.page')).default;
  } catch {
    return (await import('../calendar.page')).default;
  }
}
