import {
  afterNextRender,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';
import { loadDashboardRenderer } from '../../dashboard/leptos-renderer';

export type FitnessKind =
  | 'today'
  | 'week'
  | 'entry'
  | 'effort'
  | 'rows'
  | 'summary'
  | 'replay'
  | 'exercises'
  | 'trend'
  | 'actions'
  | 'tabs'
  | 'details';
export interface FitnessAction {
  type: string;
  value: string;
}
interface FitnessHandle {
  update(value: string): void;
  dispose(): void;
  free(): void;
}
export interface FitnessIndex {
  query(json: string): string;
  free(): void;
}
interface FitnessRenderer {
  createFitnessIndex(json: string): FitnessIndex;
  mountFitness(
    element: HTMLElement,
    kind: FitnessKind,
    json: string,
    dispatch: (action: FitnessAction) => void,
  ): FitnessHandle;
}

let active: FitnessRenderer | undefined;
export async function loadFitness(): Promise<void> {
  const module = await loadDashboardRenderer();
  if (!('mountFitness' in module) || typeof module.mountFitness !== 'function')
    throw new Error('Fitness renderer unavailable');
  if (!('createFitnessIndex' in module) || typeof module.createFitnessIndex !== 'function')
    throw new Error('Workout search unavailable');
  active = module as typeof module & FitnessRenderer;
}
export function createFitnessIndex(json: string): FitnessIndex {
  if (!active) throw new Error('Fitness renderer unavailable');
  return active.createFitnessIndex(json);
}
@Directive({ selector: '[appFitnessView]' })
export class FitnessView {
  readonly appFitnessView = input.required<FitnessKind>();
  readonly snapshot = input.required<string>();
  readonly fitnessAction = output<FitnessAction>();
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private handle?: FitnessHandle;
  constructor() {
    const destroyed = inject(DestroyRef);
    afterNextRender(() => {
      if (destroyed.destroyed || !active) return;
      this.handle = active.mountFitness(
        this.element.nativeElement,
        this.appFitnessView(),
        this.snapshot(),
        (action) => this.fitnessAction.emit(action),
      );
    });
    effect(() => {
      const next = this.snapshot();
      this.handle?.update(next);
    });
    destroyed.onDestroy(() => {
      this.handle?.free();
      this.handle = undefined;
    });
  }
}
