import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ProfileStore } from '../../core/stores/profile.store';
import OnboardingPage from './onboarding.page';

describe('OnboardingPage body information', () => {
  let fixture: ComponentFixture<OnboardingPage>;
  let save: jasmine.Spy;

  beforeEach(async () => {
    save = jasmine.createSpy('saveOnboardingProfile').and.resolveTo();
    await TestBed.configureTestingModule({
      imports: [OnboardingPage],
      providers: [
        provideRouter([]),
        { provide: ProfileStore, useValue: { saveOnboardingProfile: save } },
      ],
    }).compileComponents();
    spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    fixture = TestBed.createComponent(OnboardingPage);
    fixture.detectChanges();
    click('[role="radio"]');
    click('[data-testid="onb-step1-continue"]');
  });

  function click(selector: string): void {
    fixture.nativeElement.querySelector(selector).click();
    fixture.detectChanges();
  }

  function input(selector: string, value: string): void {
    const element: HTMLInputElement = fixture.nativeElement.querySelector(selector);
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  async function finish(): Promise<void> {
    click('[data-testid="onb-step2-continue"]');
    click('[aria-label="Mức vận động"] [role="radio"]');
    click('[aria-label="Kinh nghiệm tập gym"] [role="radio"]');
    click('[data-testid="onb-step3-finish"]');
    await fixture.whenStable();
  }

  it('allows the same body limits as Settings without inventing a birthday', async () => {
    const height: HTMLInputElement = fixture.nativeElement.querySelector('#field-height');
    expect([height.min, height.max]).toEqual(['100', '250']);
    input('#field-height', '100');
    input('#field-weight', '300');
    input('#field-age', '10');
    click('[aria-label="Giới tính"] [role="radio"]');
    await finish();
    expect(save).toHaveBeenCalledOnceWith(
      jasmine.objectContaining({
        height_cm: 100,
        weight_kg: 300,
        age: 10,
        birth_date: null,
        target_calories: 0,
      }),
    );
  });

  it('shows an inline error for a fractional age, then uses a birthday throughout the wizard', async () => {
    input('#field-height', '170');
    input('#field-weight', '65');
    input('#field-age', '29.5');
    click('[aria-label="Giới tính"] [role="radio"]');
    click('[data-testid="onb-step2-continue"]');
    expect(fixture.nativeElement.querySelector('#err-age')?.textContent).toContain('số năm tròn');
    const date = `${new Date().getFullYear() - 29}-01-01`;
    input('#field-birth-date', date);
    const age: HTMLInputElement = fixture.nativeElement.querySelector('#field-age');
    expect(age.readOnly).toBeTrue();
    expect(age.value).toBe('29');
    await finish();
    expect(save).toHaveBeenCalledOnceWith(jasmine.objectContaining({ age: 29, birth_date: date }));
  });
});
