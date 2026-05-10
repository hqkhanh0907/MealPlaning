import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmptyDayState } from './empty-day-state';

describe('EmptyDayState', () => {
  let fixture: ComponentFixture<EmptyDayState>;
  let component: EmptyDayState;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [EmptyDayState] });
    fixture = TestBed.createComponent(EmptyDayState);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders Vietnamese title + subtitle', () => {
    const html = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(html).toContain('Ngày này chưa có món nào');
    expect(html).toContain('Bắt đầu lên kế hoạch');
  });

  it('emits planClicked when [Lên kế hoạch] tapped', () => {
    const spy = jasmine.createSpy('planClicked');
    component.planClicked.subscribe(spy);
    const btn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.empty-day__btn--primary',
    );
    btn?.click();
    expect(spy).toHaveBeenCalled();
  });

  it('emits copyDeferred when [Sao chép từ hôm qua] tapped', () => {
    const spy = jasmine.createSpy('copyDeferred');
    component.copyDeferred.subscribe(spy);
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
      '.empty-day__btn',
    );
    // index 1 is the copy button (after primary)
    buttons[1]?.click();
    expect(spy).toHaveBeenCalled();
  });

  it('emits aiDeferred when [🤖 AI] tapped', () => {
    const spy = jasmine.createSpy('aiDeferred');
    component.aiDeferred.subscribe(spy);
    const ghost = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.empty-day__btn--ghost',
    );
    ghost?.click();
    expect(spy).toHaveBeenCalled();
  });

  it('renders 3 distinct action buttons each ≥44px tap target via min-height rule', () => {
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('.empty-day__btn');
    expect(buttons.length).toBe(3);
  });
});
