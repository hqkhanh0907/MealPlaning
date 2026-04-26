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
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Trứng & Sữa');
    expect(text).toContain('Rau củ');
  });

  it('emits dismissed when cancel is clicked', () => {
    let closed = false;
    component.dismissed.subscribe(() => {
      closed = true;
    });

    const button = fixture.nativeElement.querySelector('.modal-cancel') as HTMLButtonElement;
    button.click();

    expect(closed).toBeTrue();
  });

  it('emits submitted payload when form is valid', () => {
    let payload: unknown = null;
    component.submitted.subscribe((value) => {
      payload = value;
    });

    component.form.name = 'Trứng gà';
    component.form.category = 'Trứng & Sữa';
    component.form.nutrition_basis_unit = 'g';
    component.form.calories = 155;
    component.form.protein = 13;
    fixture.detectChanges();

    const saveButton = fixture.nativeElement.querySelector('.modal-save') as HTMLButtonElement;
    saveButton.click();

    expect(payload).toEqual(jasmine.objectContaining({
      name: 'Trứng gà',
      category: 'Trứng & Sữa',
      nutrition_basis_unit: 'g',
      calories: 155,
      protein: 13,
    }));
  });
});
