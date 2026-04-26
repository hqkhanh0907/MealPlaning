import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DishEditModalComponent } from './dish-edit-modal.component';

describe('DishEditModalComponent', () => {
  let fixture: ComponentFixture<DishEditModalComponent>;
  let component: DishEditModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DishEditModalComponent] }).compileComponents();
    fixture = TestBed.createComponent(DishEditModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', true);
    component.ingredients = [
      {
        id: 'ingredient-1',
        name: 'Trứng gà',
        category: 'Trứng & Sữa',
        nutrition_basis_unit: 'g',
        nutrition_basis_quantity: 100,
        calories: 155,
        protein: 13,
        carbs: 1.1,
        fat: 11,
        fiber: 0,
        density_g_per_ml: null,
        source: 'manual',
        created_at: '2026-04-26T00:00:00Z',
        updated_at: null,
        units: [
          {
            ingredient_id: 'ingredient-1',
            unit_id: 'g',
            factor_to_basis: 1,
            is_default: 1,
            display_label: 'g',
            is_approximate: 0,
            short_name_vi: 'g',
            display_name_vi: 'gram',
          },
        ],
      },
    ];
    fixture.detectChanges();
  });

  it('disables submit when required fields are empty', () => {
    const button = fixture.nativeElement.querySelector('.btn-cta') as HTMLButtonElement;
    expect(button.disabled).toBeFalse();
    component.submit();
    fixture.detectChanges();
    expect(component.showErrors).toBeTrue();
  });

  it('emits trimmed payload when form is valid', () => {
    let submittedName = '';
    component.submitted.subscribe((value) => {
      submittedName = value.name;
    });

    component.form = {
      name: ' Cơm trứng ',
      description: ' nhanh ',
      servings: 1,
      items: [
        {
          local_id: 'item-1',
          ingredient_id: 'ingredient-1',
          amount_value: 2,
          unit_id: 'g',
        },
      ],
    };
    fixture.detectChanges();
    component.submit();

    expect(submittedName).toBe('Cơm trứng');
  });
});
