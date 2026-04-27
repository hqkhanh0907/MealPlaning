import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IngredientEditModalComponent } from './ingredient-edit-modal.component';

describe('IngredientEditModalComponent', () => {
  let fixture: ComponentFixture<IngredientEditModalComponent>;
  let component: IngredientEditModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IngredientEditModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IngredientEditModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
  });

  it('renders category options', () => {
    const categories = component.categoryOptions.map((o) => o.label).join(' ');
    expect(categories).toContain('Trứng & Sữa');
    expect(categories).toContain('Rau củ');
  });

  it('emits dismissed when back button is clicked', () => {
    let closed = false;
    component.dismissed.subscribe(() => {
      closed = true;
    });

    const button = fixture.nativeElement.querySelector('.toolbar-icon-button') as HTMLButtonElement;
    button.click();

    expect(closed).toBeTrue();
  });

  it('emits submitted payload when form is valid', () => {
    let payload: unknown = null;
    component.submitted.subscribe((value) => {
      payload = value;
    });

    fixture.componentRef.setInput('form', {
      name: 'Trứng gà',
      category: 'Trứng & Sữa',
      nutrition_basis_unit: 'g',
      calories: 155,
      protein: 13,
      carbs: null,
      fat: null,
      fiber: null,
      density_g_per_ml: null,
      units: [
        {
          local_id: 'u1',
          unit_id: 'unit-g',
          factor_to_basis: 1,
          is_default: true,
          display_label: 'g',
          is_approximate: false,
          short_name_vi: 'g',
        },
      ],
    });
    fixture.detectChanges();

    const saveButton = fixture.nativeElement.querySelector(
      '.toolbar-save-button',
    ) as HTMLButtonElement;
    saveButton.click();

    expect(payload).toEqual(
      jasmine.objectContaining({
        name: 'Trứng gà',
        category: 'Trứng & Sữa',
        nutrition_basis_unit: 'g',
        calories: 155,
        protein: 13,
      }),
    );
  });
});
