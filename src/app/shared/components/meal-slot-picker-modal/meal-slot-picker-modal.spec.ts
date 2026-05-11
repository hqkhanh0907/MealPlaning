import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MealSlotPickerModal } from './meal-slot-picker-modal';

describe('MealSlotPickerModal', () => {
  let fixture: ComponentFixture<MealSlotPickerModal>;
  let component: MealSlotPickerModal;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MealSlotPickerModal] }).compileComponents();
    fixture = TestBed.createComponent(MealSlotPickerModal);
    component = fixture.componentInstance;
  });

  it('does not render when isOpen=false', () => {
    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.msp-sheet')).toBeNull();
  });

  it('renders 4 chips with breakfast/lunch/dinner/snack labels', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
    const chips = Array.from(fixture.nativeElement.querySelectorAll('.msp-chip')) as HTMLElement[];
    expect(chips.length).toBe(4);
    const labels = chips.map((c) => c.querySelector('.msp-chip-label')?.textContent?.trim());
    expect(labels).toEqual(['Sáng', 'Trưa', 'Tối', 'Phụ']);
  });

  it('emits slotSelected with correct meal_type per chip click', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
    const captured: string[] = [];
    component.slotSelected.subscribe((t) => captured.push(t));
    const chips = Array.from(
      fixture.nativeElement.querySelectorAll('.msp-chip'),
    ) as HTMLButtonElement[];
    chips[0].click();
    chips[3].click();
    expect(captured).toEqual(['breakfast', 'snack']);
  });

  it('marks current chip with aria-pressed=true', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('current', 'lunch');
    fixture.detectChanges();
    const chips = Array.from(
      fixture.nativeElement.querySelectorAll('.msp-chip'),
    ) as HTMLButtonElement[];
    expect(chips[1].getAttribute('aria-pressed')).toBe('true');
    expect(chips[0].getAttribute('aria-pressed')).toBe('false');
  });

  it('emits dismissed on backdrop and cancel button', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
    let count = 0;
    component.dismissed.subscribe(() => count++);
    (fixture.nativeElement.querySelector('.msp-cancel') as HTMLButtonElement).click();
    (fixture.nativeElement.querySelector('.msp-backdrop__dismiss') as HTMLButtonElement).click();
    expect(count).toBe(2);
  });

  it('uses custom title input when provided', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('title', 'Di chuyển sang bữa nào?');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.msp-title').textContent.trim()).toBe(
      'Di chuyển sang bữa nào?',
    );
  });
});
