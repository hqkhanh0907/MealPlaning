import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NutritionBadgeComponent } from './nutrition-badge.component';

describe('NutritionBadgeComponent', () => {
  let fixture: ComponentFixture<NutritionBadgeComponent>;
  let component: NutritionBadgeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NutritionBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NutritionBadgeComponent);
    component = fixture.componentInstance;
    component.calories = 155;
    component.protein = 13;
    fixture.detectChanges();
  });

  it('renders calories and protein', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('155 kcal');
    expect(text).toContain('13g protein');
  });

  it('shows approximate marker when requested', () => {
    fixture.componentRef.setInput('approximate', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('≈ 155 kcal');
  });
});
