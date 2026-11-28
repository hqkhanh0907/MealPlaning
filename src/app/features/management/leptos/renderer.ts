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

export type ManagementKind = 'catalog' | 'ingredient' | 'dishNutrition' | 'dishItems';
export interface ManagementAction {
  type: string;
  value: string;
}
interface ManagementHandle {
  update(value: string): void;
  dispose(): void;
  free(): void;
}
interface ManagementRenderer {
  mountManagement(
    element: HTMLElement,
    kind: ManagementKind,
    json: string,
    dispatch: (action: ManagementAction) => void,
  ): ManagementHandle;
}

let active: ManagementRenderer | undefined;
export async function loadManagement(): Promise<void> {
  const module = await loadDashboardRenderer();
  if (!('mountManagement' in module) || typeof module.mountManagement !== 'function')
    throw new Error('Management renderer unavailable');
  active = module as typeof module & ManagementRenderer;
}
@Directive({ selector: '[appManagementView]' })
export class ManagementView {
  readonly appManagementView = input.required<ManagementKind>();
  readonly snapshot = input.required<string>();
  readonly managementAction = output<ManagementAction>();
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private handle?: ManagementHandle;
  constructor() {
    const destroyed = inject(DestroyRef);
    afterNextRender(() => {
      if (destroyed.destroyed || !active) return;
      this.handle = active.mountManagement(
        this.element.nativeElement,
        this.appManagementView(),
        this.snapshot(),
        (action) => this.managementAction.emit(action),
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
