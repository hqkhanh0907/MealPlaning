import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  Input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { form, FormField, maxLength } from '@angular/forms/signals';
import {
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  arrowBackOutline,
  closeOutline,
  optionsOutline,
  searchOutline,
} from 'ionicons/icons';
import {
  discoveryMuscleLabels,
  equipmentFilterChoices,
  exerciseEquipmentLabel,
  filterExerciseIndex,
  indexExercise,
  inventoryChoices,
} from '../../../core/models/exercise-discovery';
import type { CatalogDiscoveryMuscle } from '../../../core/models/exercise-catalog.types';
import type { Exercise } from '../../../core/models/fitness.types';
import {
  ExercisePlaceRepository,
  type ExercisePlace,
} from '../../../core/repositories/exercise-place.repository';
import { normalize } from '../../../core/utils/fuzzy-match';
import { AppFormField } from '../../forms/form-field/form-field';

type PickerView = 'results' | 'filters' | 'place';
type FilterChip = 'muscle' | 'equipment' | 'place';

@Component({
  selector: 'app-exercise-picker-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppFormField,
    FormField,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonFooter,
    IonIcon,
  ],
  templateUrl: './exercise-picker-sheet.html',
  styleUrl: './exercise-picker-sheet.scss',
})
export class ExercisePickerSheet {
  private readonly places = inject(ExercisePlaceRepository);
  private readonly injector = inject(Injector);
  private readonly modal = viewChild<unknown, ElementRef<HTMLElement>>('pickerModal', {
    read: ElementRef,
  });

  readonly exercises = input.required<readonly Exercise[]>();
  readonly closed = output<void>();
  readonly exerciseSelected = output<string>();

  @Input() set isOpen(value: boolean) {
    this.visible.set(value);
  }

  protected readonly visible = signal(false);
  protected readonly view = signal<PickerView>('results');
  protected readonly title = computed(
    () =>
      ({
        results: 'Chọn bài tập',
        filters: 'Lọc bài tập',
        place: 'Dụng cụ nơi tập',
      })[this.view()],
  );

  protected readonly query = signal('');
  protected readonly muscle = signal<CatalogDiscoveryMuscle | null>(null);
  protected readonly equipment = signal<string | null>(null);
  protected readonly placeId = signal<string | null>(null);
  protected readonly muscleChoices = Object.entries(discoveryMuscleLabels) as [
    CatalogDiscoveryMuscle,
    string,
  ][];
  protected readonly muscleLabels = discoveryMuscleLabels;
  protected readonly equipmentChoices = equipmentFilterChoices;
  protected readonly equipmentLabel = exerciseEquipmentLabel;
  protected readonly profiles = signal<readonly ExercisePlace[]>([]);
  protected readonly placeLoadError = signal(false);
  protected readonly place = computed(() =>
    this.profiles().find(({ id }) => id === this.placeId()),
  );
  protected readonly hasFilters = computed(
    () => !!(this.muscle() || this.equipment() || this.placeId()),
  );

  private readonly index = computed(() => this.exercises().map(indexExercise));
  protected readonly results = computed(() =>
    filterExerciseIndex(this.index(), {
      query: this.query(),
      muscle: this.muscle(),
      equipment: this.equipment(),
      available: this.place()?.equipment ?? null,
    }),
  );

  protected readonly placeName = signal({ name: '' });
  protected readonly placeForm = form(this.placeName, (schema) => maxLength(schema.name, 48));
  protected readonly placeEquipment = signal<ReadonlySet<string>>(new Set());
  protected readonly inventorySearch = signal('');
  protected readonly inventory = computed(() => {
    const term = normalize(this.inventorySearch());
    return inventoryChoices.filter(([, label]) => normalize(label).includes(term));
  });
  protected readonly saving = signal(false);
  protected readonly saveError = signal(false);

  constructor() {
    addIcons({ addOutline, arrowBackOutline, closeOutline, optionsOutline, searchOutline });
  }

  protected readonly canDismiss = async (): Promise<boolean> => {
    if (this.saving()) return false;
    if (this.view() === 'results') return true;
    this.back();
    return false;
  };

  protected async loadPlaces(): Promise<void> {
    this.placeLoadError.set(false);
    try {
      this.profiles.set(await this.places.list());
    } catch {
      this.placeLoadError.set(true);
    }
  }

  protected openFilters(): void {
    this.view.set('filters');
    this.focusAfterRender('ion-title');
  }

  protected showResults(): void {
    this.view.set('results');
    this.focusAfterRender('[data-picker-open-filters]');
  }

  protected back(): void {
    if (this.view() === 'place') {
      this.view.set('filters');
      this.focusAfterRender('[data-place-edit]');
      return;
    }
    this.showResults();
  }

  protected editPlace(place: ExercisePlace): void {
    this.placeName.set({ name: place.name });
    this.placeEquipment.set(new Set(place.equipment ?? []));
    this.inventorySearch.set('');
    this.saveError.set(false);
    this.view.set('place');
    this.focusAfterRender('ion-title');
  }

  protected updateInventory(key: string, checked: boolean): void {
    this.placeEquipment.update((current) => {
      const next = new Set(current);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  protected async savePlace(): Promise<void> {
    const place = this.place();
    const name = this.placeName().name.trim();
    if (!place || !name || this.placeForm().invalid() || this.saving()) return;

    this.saving.set(true);
    this.saveError.set(false);
    try {
      this.profiles.set(
        await this.places.save({ ...place, name, equipment: [...this.placeEquipment()] }),
      );
      this.back();
    } catch {
      this.saveError.set(true);
    } finally {
      this.saving.set(false);
    }
  }

  protected clearFilter(filter: FilterChip): void {
    if (filter === 'muscle') this.muscle.set(null);
    if (filter === 'equipment') this.equipment.set(null);
    if (filter === 'place') this.placeId.set(null);
    this.focusAfterRender('[data-picker-open-filters]');
  }

  protected clearFilters(): void {
    this.muscle.set(null);
    this.equipment.set(null);
    this.placeId.set(null);
    this.focusAfterRender(
      this.view() === 'results' ? '[data-picker-open-filters]' : '[data-picker-show-results]',
    );
  }

  protected pick(id: string): void {
    if (!this.visible()) return;
    this.visible.set(false);
    this.exerciseSelected.emit(id);
  }

  protected close(): void {
    this.visible.set(false);
  }

  protected afterDismiss(): void {
    this.visible.set(false);
    this.view.set('results');
    this.closed.emit();
  }

  private focusAfterRender(selector: string): void {
    afterNextRender(
      {
        write: () => {
          const modal = this.modal()?.nativeElement;
          void modal?.querySelector('ion-content')?.scrollToTop(0);
          modal?.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true });
        },
      },
      { injector: this.injector },
    );
  }
}
