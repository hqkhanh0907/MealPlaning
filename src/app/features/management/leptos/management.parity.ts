import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import {
  createTestDatabase,
  teardownTestDatabase,
} from '../../../core/services/database/__test__/create-test-database';
import { Database } from '../../../core/services/database/database';
import { IngredientRepository } from '../../../core/repositories/ingredient.repository';
import { DishRepository } from '../../../core/repositories/dish.repository';
import { DishStore } from '../../../core/stores/dish.store';
import LeptosIngredientPage from './ingredient.page';
import LeptosDishPage from './dish.page';
import LeptosCatalogPage from './catalog.page';
import ManagementPage from '../management.page';
import { loadManagement } from './renderer';

describe('Leptos management and the catalog database', () => {
  beforeAll(async () => {
    await loadManagement();
  });
  beforeEach(async () => {
    const db = await createTestDatabase();
    await TestBed.configureTestingModule({
      imports: [LeptosIngredientPage, LeptosDishPage, LeptosCatalogPage, ManagementPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: Database, useValue: db },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}), queryParams: {} } },
        },
      ],
    }).compileComponents();
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
  });
  afterEach(() => {
    teardownTestDatabase();
  });

  function typeInto<T>(fixture: ComponentFixture<T>, selector: string, value: string): void {
    const node: HTMLInputElement = fixture.nativeElement.querySelector(selector);
    node.value = value;
    node.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }
  it('saves gram nutrition, updates nested recipe weights and blocks deleting referenced ingredients', async () => {
    const ingredient = TestBed.createComponent(LeptosIngredientPage);
    ingredient.detectChanges();
    await ingredient.whenStable();
    const page = ingredient.componentInstance;
    typeInto(ingredient, '#ingr-field-name', 'Đậu so sánh');
    page.onCategorySelected('Đậu & Hạt');
    typeInto(ingredient, '#ingr-field-calories', '110');
    typeInto(ingredient, '#ingr-field-protein', '101');
    await page.onSave();
    expect(page.hasUnsavedChanges()).toBeTrue();
    const ingredients = TestBed.inject(IngredientRepository);
    expect(await ingredients.list()).toEqual([]);
    typeInto(ingredient, '#ingr-field-protein', '10');
    typeInto(ingredient, '#ingr-field-fiber', '');
    await page.onSave();
    const [row] = await ingredients.list();
    expect(row).toEqual(
      jasmine.objectContaining({ name: 'Đậu so sánh', calories: 110, protein: 10, fiber: 0 }),
    );
    ingredient.destroy();

    const dish = TestBed.createComponent(LeptosDishPage);
    dish.detectChanges();
    await dish.whenStable();
    typeInto(dish, '#dish-field-name', 'Món đậu');
    typeInto(dish, '#dish-field-servings', '2');
    const recipe = dish.componentInstance;
    await recipe.openIngredientPicker();
    recipe.onIngredientSelected(row.id);
    recipe.saveGramDraft();
    const [portion] = JSON.parse(recipe.snapshot()).rows as { id: string; grams: number }[];
    expect(portion.grams).toBe(100);
    recipe.dispatch({ type: 'editItem', value: portion.id });
    recipe.gramDraft.update((draft) => draft && { ...draft, gram_weight: 50 });
    recipe.closeGramSheet();
    expect(JSON.parse(recipe.snapshot()).rows[0].grams).toBe(100);
    recipe.dispatch({ type: 'editItem', value: portion.id });
    recipe.gramDraft.update((draft) => draft && { ...draft, gram_weight: 50 });
    recipe.saveGramDraft();
    await recipe.onSave();
    const dishes = TestBed.inject(DishStore);
    await dishes.load();
    const [saved] = dishes.dishes();
    expect(saved).toEqual(
      jasmine.objectContaining({
        name: 'Món đậu',
        total_calories: 27.5,
        total_protein: 2.5,
        servings: 2,
      }),
    );
    dish.destroy();

    Object.assign(TestBed.inject(ActivatedRoute).snapshot, {
      paramMap: convertToParamMap({ id: saved.id }),
    });
    const editor = TestBed.createComponent(LeptosDishPage);
    editor.detectChanges();
    await editor.whenStable();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    editor.detectChanges();
    const edit = editor.componentInstance;
    const current = JSON.parse(edit.snapshot()).rows as { id: string; grams: number }[];
    expect(current[0].grams).toBe(50);
    expect(edit.hasUnsavedChanges()).toBeFalse();
    typeInto(editor, '#dish-field-servings', '4');
    expect(edit.hasUnsavedChanges()).toBeTrue();
    await edit.onSave();
    const changed = await TestBed.inject(DishRepository).getById(saved.id);
    expect(changed?.servings).toBe(4);
    expect(changed?.total_calories).toBe(13.75);
    expect(changed?.ingredients[0].gram_weight).toBe(50);
    editor.destroy();

    const catalog = TestBed.createComponent(LeptosCatalogPage);
    catalog.detectChanges();
    await catalog.whenStable();
    const library = catalog.componentInstance;
    await library.openIngredientDeleteDialog(row.id, row.name);
    expect(library.ingredientDeleteBlocked()).toBeTrue();
    await library.confirmIngredientDelete();
    expect(library.tab()).toBe('dishes');
    expect((await ingredients.list()).map((i) => i.id)).toEqual([row.id]);
  });

  for (const [label, component] of [
    ['Angular', ManagementPage],
    ['Leptos', LeptosCatalogPage],
  ] as const) {
    for (const enforce of [false, true]) {
      it(`${label} observes the actual recipe references with SQLite foreign keys ${enforce ? 'on' : 'as persisted by sql.js'}`, async () => {
        const db = TestBed.inject(Database);
        const ingredients = TestBed.inject(IngredientRepository);
        const ingredient = await ingredients.insert({
          name: 'Đậu',
          category: 'Đậu & Hạt',
          source: 'manual',
          calories: 110,
          protein: 10,
          carbs: 0,
          fat: 0,
          fiber: 0,
        });
        const dish = await TestBed.inject(DishRepository).insert(
          {
            name: 'Món đậu',
            description: null,
            source: 'custom',
            type: 'ingredient_based',
            servings: 2,
            image_url: null,
          },
          [{ ingredient_id: ingredient.id, gram_weight: 50 }],
        );
        const fixture = TestBed.createComponent<ManagementPage>(component);
        fixture.detectChanges();
        await fixture.whenStable();
        const page = fixture.componentInstance;
        await page.openDishDeleteDialog(dish.id, dish.name);
        if (enforce) await db.query('PRAGMA foreign_keys = ON');
        expect(await db.query('PRAGMA foreign_keys')).toEqual([{ foreign_keys: enforce ? 1 : 0 }]);
        await page.confirmDishDelete();
        expect(await db.query('SELECT id FROM dish')).toEqual([]);
        await page.openIngredientDeleteDialog(ingredient.id, ingredient.name);
        expect(page.ingredientDeleteReferenceCount()).toBe(enforce ? 0 : 1);
        await page.confirmIngredientDelete();
        expect((await ingredients.list()).map((item) => item.id)).toEqual(
          enforce ? [] : [ingredient.id],
        );
      });
    }
  }
});
