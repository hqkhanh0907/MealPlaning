import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DishStore } from '../../core/stores/dish.store';
import { IngredientStore } from '../../core/stores/ingredient.store';
import ManagementPage from './management.page';

describe('ManagementPage', () => {
  let fixture: ComponentFixture<ManagementPage>;
  let component: ManagementPage;
  let router: jasmine.SpyObj<Router>;
  let ingredientItems: { id: string; name: string }[];
  let dishItems: { id: string; name: string }[];

  beforeEach(async () => {
    ingredientItems = [];
    dishItems = [];
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.resolveTo(true);

    const ingredientStore = {
      ingredients: () => ingredientItems,
      loading: () => false,
      searchQuery: () => '',
      load: jasmine.createSpy().and.resolveTo(),
      search: jasmine.createSpy().and.resolveTo(),
      remove: jasmine.createSpy().and.resolveTo(),
      countDishReferences: jasmine.createSpy().and.resolveTo(0),
    };

    const dishStore = {
      dishes: () => dishItems,
      loading: () => false,
      searchQuery: () => '',
      load: jasmine.createSpy().and.resolveTo(),
      search: jasmine.createSpy().and.resolveTo(),
      remove: jasmine.createSpy().and.resolveTo(),
      countReferences: jasmine.createSpy().and.resolveTo(0),
    };

    await TestBed.configureTestingModule({
      imports: [ManagementPage],
      providers: [
        { provide: Router, useValue: router },
        { provide: IngredientStore, useValue: ingredientStore },
        { provide: DishStore, useValue: dishStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ManagementPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('renders segment labels', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Nguyên liệu');
    expect(text).toContain('Món ăn');
  });

  it('renders reusable segmented control shell', () => {
    const segment = fixture.nativeElement.querySelector('app-segmented-control');
    expect(segment).toBeTruthy();
  });

  it('forwards ingredient search query to the store', async () => {
    await component.onIngredientSearch('trứng');

    const ingredientStore = TestBed.inject(IngredientStore) as unknown as {
      search: jasmine.Spy;
    };
    expect(ingredientStore.search).toHaveBeenCalledWith('trứng');
  });

  it('navigates to settings when settings button is clicked', async () => {
    await component.openSettings();
    expect(router.navigate).toHaveBeenCalledWith(['/settings']);
  });

  it('navigates to create-ingredient route when openCreateIngredient is called', () => {
    component.openCreateIngredient();
    expect(router.navigate).toHaveBeenCalledWith(['/tabs/management/ingredient/new']);
  });

  it('navigates to edit-ingredient route when openEditIngredient is called', () => {
    component.openEditIngredient('ingredient-1');
    expect(router.navigate).toHaveBeenCalledWith([
      '/tabs/management/ingredient/edit',
      'ingredient-1',
    ]);
  });

  it('navigates to create-dish route when openCreateDish is called', async () => {
    await component.openCreateDish();
    expect(router.navigate).toHaveBeenCalledWith(['/tabs/management/dish/new']);
  });

  it('navigates to edit-dish route when openEditDish is called', async () => {
    await component.openEditDish('dish-1');
    expect(router.navigate).toHaveBeenCalledWith(['/tabs/management/dish/edit', 'dish-1']);
  });

  it('removes ingredient after confirm delete when there are no references', async () => {
    await component.openIngredientDeleteDialog('ingredient-1', 'Trứng gà');
    await component.confirmIngredientDelete();

    const ingredientStore = TestBed.inject(IngredientStore) as unknown as {
      remove: jasmine.Spy;
    };
    expect(ingredientStore.remove).toHaveBeenCalledWith('ingredient-1');
    expect(component.pendingIngredientDeleteId()).toBeNull();
  });

  it('shows source labels using Vietnamese display names', () => {
    expect(component.ingredientSourceLabel('db')).toBe('Có sẵn');
    expect(component.ingredientSourceLabel('ai')).toBe('AI');
    expect(component.ingredientSourceLabel('manual')).toBe('Tự tạo');
    expect(component.dishSourceLabel('ai')).toBe('AI');
    expect(component.dishSourceLabel('custom')).toBe('Tự tạo');
  });

  it('maps ingredient categories and dish types to visual badge classes', () => {
    expect(component.ingredientCategoryClass('Thịt')).toBe('badge--category-cat-thit');
    expect(component.ingredientCategoryClass('Trứng & Sữa')).toBe('badge--category-cat-trung');
    expect(component.ingredientCategoryClass('Không rõ')).toBe('badge--category-cat-khac');
    expect(component.dishTypeClass('ingredient_based')).toBe('badge--type-ingredient');
    expect(component.dishTypeClass('ai_autofill')).toBe('badge--type-ai');
  });
});
