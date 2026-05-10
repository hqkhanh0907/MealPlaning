import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecipeChangedBanner } from './recipe-changed-banner';

describe('RecipeChangedBanner', () => {
  let fixture: ComponentFixture<RecipeChangedBanner>;
  let component: RecipeChangedBanner;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeChangedBanner],
    }).compileComponents();
    fixture = TestBed.createComponent(RecipeChangedBanner);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('snapshotCalories', 500);
    fixture.componentRef.setInput('currentCalories', 540);
    fixture.componentRef.setInput('diffPct', 8);
  });

  it('renders snapshot bold + current italic', () => {
    fixture.detectChanges();
    const snap = fixture.nativeElement.querySelector('.recipe-changed-banner__snapshot');
    const cur = fixture.nativeElement.querySelector('.recipe-changed-banner__current');
    expect(snap.textContent).toContain('500');
    expect(cur.textContent).toContain('540');
  });

  it('computes positive delta + sign', () => {
    fixture.detectChanges();
    expect(component.delta()).toBe(40);
    expect(component.deltaSign()).toBe('+');
    expect(component.absDelta()).toBe(40);
  });

  it('computes negative delta + minus sign', () => {
    fixture.componentRef.setInput('snapshotCalories', 600);
    fixture.componentRef.setInput('currentCalories', 540);
    fixture.componentRef.setInput('diffPct', -10);
    fixture.detectChanges();
    expect(component.delta()).toBe(-60);
    expect(component.deltaSign()).toBe('−');
    expect(component.absDelta()).toBe(60);
    expect(component.absDiffPct()).toBe(10);
  });

  it('emits faqLinkClicked on link click and prevents default', () => {
    let emitted = false;
    component.faqLinkClicked.subscribe(() => (emitted = true));
    fixture.detectChanges();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector(
      '.recipe-changed-banner__faq',
    );
    const event = new MouseEvent('click', { cancelable: true, bubbles: true });
    link.dispatchEvent(event);
    expect(emitted).toBe(true);
    expect(event.defaultPrevented).toBe(true);
  });

  it('aria-label includes snapshot, current, delta, percentage', () => {
    fixture.detectChanges();
    const label = component.ariaLabel();
    expect(label).toContain('500');
    expect(label).toContain('540');
    expect(label).toContain('40');
    expect(label).toContain('8');
  });

  it('zero delta produces empty sign', () => {
    fixture.componentRef.setInput('snapshotCalories', 500);
    fixture.componentRef.setInput('currentCalories', 500);
    fixture.componentRef.setInput('diffPct', 0);
    fixture.detectChanges();
    expect(component.deltaSign()).toBe('');
    expect(component.absDelta()).toBe(0);
  });
});
