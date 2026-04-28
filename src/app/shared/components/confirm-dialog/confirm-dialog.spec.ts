import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialog } from './confirm-dialog';

describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmDialog>;
  let component: ConfirmDialog;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialog);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('title', 'Xóa nguyên liệu?');
    fixture.componentRef.setInput('message', 'Hành động này không thể hoàn tác.');
    fixture.detectChanges();
  });

  it('renders title and message when open', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Xóa nguyên liệu?');
    expect(text).toContain('Hành động này không thể hoàn tác.');
  });

  it('emits confirm event when confirm button is clicked', () => {
    let confirmed = false;
    component.confirmed.subscribe(() => {
      confirmed = true;
    });

    const button = fixture.nativeElement.querySelector('.dialog-btn-danger') as HTMLButtonElement;
    button.click();

    expect(confirmed).toBeTrue();
  });

  it('emits cancel event when cancel button is clicked', () => {
    let cancelled = false;
    component.cancelled.subscribe(() => {
      cancelled = true;
    });

    const button = fixture.nativeElement.querySelector('.dialog-btn-cancel') as HTMLButtonElement;
    button.click();

    expect(cancelled).toBeTrue();
  });

  it('renders primary confirm button variant when configured', () => {
    fixture.componentRef.setInput('confirmVariant', 'primary');
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      '.dialog-btn-primary',
    ) as HTMLButtonElement | null;
    expect(button).not.toBeNull();
    expect(button?.textContent).toContain('Xóa');
  });
});
