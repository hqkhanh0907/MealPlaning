import { formatDate } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  LOCALE_ID,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { defineCustomElement as defineCheckbox } from '@ionic/core/components/ion-checkbox';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cloudOfflineOutline } from 'ionicons/icons';
import { NetworkStore } from '../../core/stores/network.store';
import DashboardPage from './dashboard.page';
import { leptosPhotoPortion } from './leptos-photo-portion';
import {
  loadDashboardRenderer,
  type DashboardAction,
  type DashboardHandle,
} from './leptos-renderer';

@Component({
  selector: 'app-leptos-dashboard',
  templateUrl: './leptos-dashboard.page.html',
  styleUrl: './leptos-dashboard.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    DashboardPage,
    IonButton,
    IonButtons,
    IonContent,
    IonFooter,
    IonHeader,
    IonIcon,
    IonTitle,
    IonToolbar,
  ],
})
export default class LeptosDashboardPage extends DashboardPage {
  private readonly body = viewChild.required<ElementRef<HTMLElement>>('body');
  private readonly footer = viewChild.required<ElementRef<HTMLElement>>('footer');
  private readonly renderer = signal<DashboardHandle | null>(null);
  protected readonly useLegacyView = signal(false);
  private readonly renderInjector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly locale = inject(LOCALE_ID);
  private readonly network = inject(NetworkStore);
  private readonly viewJson = computed(() => {
    const d = this.dashboard;
    const draft = d.photoDraft();
    return JSON.stringify({
      loading: d.loading(),
      refreshFailed: d.refreshFailed(),
      todayLabel: d.todayLabel(),
      loggedCalories: d.loggedCalories(),
      roundedCalories: d.roundedCalories(),
      pendingMeal: d.pendingMeal(),
      calorieTargetLabel: d.calorieTargetLabel(),
      caloriePercentLabel: d.caloriePercentLabel(),
      hasCalorieTarget: d.targets().calories > 0,
      hasNutritionData: d.hasNutritionData(),
      macroRows: d.macroRows(),
      dailyAiInsight: d.dailyAiInsight(),
      insight: d.insight(),
      nutritionStreakDays: d.nutritionStreakDays(),
      workoutStreakDisplay: d.workoutStreakDisplay(),
      weightDisplay: d.weightDisplay(),
      weightMeta: d.weightMeta(),
      online: this.network.online(),
      dailyAiLoading: d.dailyAiLoading(),
      textIssue: this.ai.textIssue(),
      insightProvider: d.insightProvider,
      insightError: this.insightError(),
      foodImageLoading: d.foodImageLoading(),
      photoIssue: this.ai.photoIssue(),
      photoSaving: d.photoSaving(),
      canSavePhoto: d.canSavePhoto(),
      photoError: this.photoError(),
      photoDraft: draft && {
        captureId: draft.captureId,
        dateLabel: formatDate(draft.date, 'dd/MM/yyyy', this.locale),
        mealType: draft.mealType,
        imageQualityWarning: draft.analysis.imageQualityWarning,
        portions: draft.portions.map((portion) => leptosPhotoPortion(portion, this.locale)),
      },
    });
  });

  constructor() {
    super();
    addIcons({ cloudOfflineOutline });
    defineCheckbox();
    afterNextRender(async () => {
      try {
        const module = await loadDashboardRenderer();
        if (this.destroyRef.destroyed) return;
        this.renderer.set(
          module.mountDashboard(
            this.body().nativeElement,
            this.footer().nativeElement,
            this.viewJson(),
            (event) => this.dispatch(event),
          ),
        );
      } catch {
        if (!this.destroyRef.destroyed) this.useLegacyView.set(true);
      }
    });
    effect(() => {
      const renderer = this.renderer();
      if (!renderer) return;
      try {
        renderer.update(this.viewJson());
      } catch {
        this.renderer.set(null);
        renderer.free();
        this.useLegacyView.set(true);
      }
    });
    this.destroyRef.onDestroy(() => this.renderer()?.free());
  }

  protected override focusResult(result: 'insight' | 'photo'): void {
    afterNextRender(() => this.renderer()?.focusResult(result), { injector: this.renderInjector });
  }

  private dispatch(action: DashboardAction): void {
    switch (action.type) {
      case 'refresh':
        void this.dashboard.refresh();
        break;
      case 'addMeal':
        void this.addMeal();
        break;
      case 'openPendingMeal':
        void this.navigateToPendingMeal(action.target);
        break;
      case 'navigate':
        void this.router.navigateByUrl(action.route);
        break;
      case 'generateDailyInsight':
        void this.generateDailyInsight();
        break;
      case 'analyzeMealPhoto':
        void this.analyzeMealPhoto();
        break;
      case 'enterPhotoMealManually':
        void this.enterPhotoMealManually();
        break;
      case 'cancelPhoto':
        this.cancelPhoto();
        break;
      case 'savePhoto':
        void this.savePhoto();
        break;
      case 'selectPhotoMeal':
        this.selectPhotoMeal(action.value);
        break;
      case 'setPhotoIncluded':
        this.dashboard.setPhotoIncluded(action.index, action.checked);
        break;
      case 'setPhotoName':
        this.dashboard.setPhotoName(action.index, action.value);
        break;
      case 'setPhotoGrams':
        this.dashboard.setPhotoGrams(action.index, action.value ?? Number.NaN);
        break;
    }
  }
}
