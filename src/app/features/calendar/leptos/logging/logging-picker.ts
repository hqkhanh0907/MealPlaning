import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { IonContent, IonHeader, IonIcon, IonModal, IonToolbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';
import type { DishListItem } from '../../../../core/repositories/dish.repository';
import type { MenuSuggestion } from '../../../../core/services/ai/menu-suggestion-ai';
import { SearchToolbar } from '../../../../shared/components/search-toolbar/search-toolbar';
import {
  LoggingModal,
  type LoggingDishSelection,
} from '../../components/logging-modal/logging-modal';
import {
  loadLoggingPicker,
  type PickerAction,
  type PickerData,
  type PickerHandle,
} from './picker-renderer';

@Directive({ selector: '[appLoggingBody]' })
export class LoggingBody {
  readonly appLoggingBody = input.required<string>();
  readonly pickerQuery = input.required<string>();
  readonly initialServings = input.required<number>();
  readonly pickerAction = output<PickerAction>();
  readonly rendererFailed = output<void>();
  private readonly handle = signal<PickerHandle | null>(null);
  private readonly destroy = inject(DestroyRef);

  constructor() {
    const host: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;
    void loadLoggingPicker()
      .then((renderer) => {
        if (this.destroy.destroyed) return;
        this.handle.set(
          renderer.mountLoggingPicker(
            host,
            this.appLoggingBody(),
            this.initialServings(),
            (action) => this.pickerAction.emit(action),
          ),
        );
      })
      .catch(() => {
        if (!this.destroy.destroyed) this.rendererFailed.emit();
      });
    effect(() => {
      try {
        this.handle()?.update(this.appLoggingBody());
      } catch {
        this.rendererFailed.emit();
      }
    });
    effect(() => this.handle()?.search(this.pickerQuery()));
    this.destroy.onDestroy(() => this.handle()?.free());
  }
}

@Component({
  selector: 'app-leptos-logging-picker',
  imports: [
    IonModal,
    IonHeader,
    IonToolbar,
    IonContent,
    IonIcon,
    SearchToolbar,
    LoggingBody,
    LoggingModal,
  ],
  templateUrl: './logging-picker.html',
  styleUrl: './logging-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class LoggingPicker {
  readonly isOpen = input(false);
  readonly mealLabel = input('bữa ăn');
  readonly allDishes = input<readonly DishListItem[]>([]);
  readonly recentDishes = input<readonly DishListItem[]>([]);
  readonly loading = input(false);
  readonly aiSuggestions = input<readonly MenuSuggestion[]>([]);
  readonly aiLoading = input(false);
  readonly aiDisabledReason = input<string | null>(null);

  readonly dishSelected = output<LoggingDishSelection>();
  readonly createDishRequested = output<void>();
  readonly aiSuggestionsRequested = output<void>();
  readonly dismissed = output<void>();

  protected readonly failed = signal(false);
  protected readonly query = signal('');
  protected readonly servings = signal(1);
  protected readonly data = computed(() =>
    JSON.stringify({
      mealLabel: this.mealLabel(),
      allDishes: this.allDishes(),
      recentDishes: this.recentDishes(),
      loading: this.loading(),
      aiLoading: this.aiLoading(),
      aiDisabledReason: this.aiDisabledReason(),
      aiSuggestions: this.aiSuggestions(),
    } satisfies PickerData),
  );
  private readonly modal = viewChild(IonModal);

  constructor() {
    addIcons({ closeOutline });
  }

  protected onDismiss(): void {
    this.query.set('');
    if (!this.failed()) this.dismissed.emit();
  }

  protected async handleAction(action: PickerAction): Promise<void> {
    switch (action.type) {
      case 'selected':
        this.dishSelected.emit({
          dishId: action.dishId,
          dishName: action.dishName,
          servings: action.servings,
        });
        break;
      case 'servings':
        this.servings.set(action.value);
        break;
      case 'ai':
        this.aiSuggestionsRequested.emit();
        break;
      case 'create':
        if (await this.modal()?.dismiss()) this.createDishRequested.emit();
        break;
    }
  }
}
