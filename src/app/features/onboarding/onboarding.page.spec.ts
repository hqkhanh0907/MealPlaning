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

  it('allows the same body limits as Settings with a required birthday', async () => {
    const height: HTMLInputElement = fixture.nativeElement.querySelector('#field-height');
    expect([height.min, height.max]).toEqual(['100', '250']);
    input('#field-height', '100');
    input('#field-weight', '300');
    const date = `${new Date().getFullYear() - 10}-01-01`;
    input('#field-birth-date', date);
    click('[aria-label="Giới tính"] [role="radio"]');
    await finish();
    expect(save).toHaveBeenCalledOnceWith(
      jasmine.objectContaining({
        height_cm: 100,
        weight_kg: 300,
        birth_date: date,
        target_calories: 0,
      }),
    );
  });

  it('shows an inline error for a future date, then uses a birthday throughout the wizard', async () => {
    input('#field-height', '170');
    input('#field-weight', '65');
    input('#field-birth-date', '2999-01-01');
    click('[aria-label="Giới tính"] [role="radio"]');
    click('[data-testid="onb-step2-continue"]');
    expect(fixture.nativeElement.querySelector('#err-birth-date')?.textContent).toContain(
      'tương lai',
    );
    const date = `${new Date().getFullYear() - 29}-01-01`;
    input('#field-birth-date', date);
    expect(fixture.nativeElement.querySelector('#field-age')).toBeNull();
    expect(fixture.nativeElement.querySelector('#field-age-hint').textContent).toContain('29 tuổi');
    await finish();
    expect(save).toHaveBeenCalledOnceWith(jasmine.objectContaining({ birth_date: date }));
  });
});
