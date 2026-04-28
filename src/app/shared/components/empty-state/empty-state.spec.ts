import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmptyState } from './empty-state';

describe('EmptyStateComponent', () => {
  let fixture: ComponentFixture<EmptyState>;
  let component: EmptyState;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyState],
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyState);
    component = fixture.componentInstance;
    component.title = 'Chưa có dữ liệu';
    component.description = 'Hãy thêm bản ghi đầu tiên';
    fixture.detectChanges();
  });

  it('renders title and description', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Chưa có dữ liệu');
    expect(text).toContain('Hãy thêm bản ghi đầu tiên');
  });

  it('emits action click when CTA is pressed', () => {
    fixture.componentRef.setInput('actionLabel', 'Thêm mới');
    fixture.detectChanges();
    let clicked = false;
    component.action.subscribe(() => {
      clicked = true;
    });

    const button = fixture.nativeElement.querySelector('.empty-action') as HTMLButtonElement;
    button.click();

    expect(clicked).toBeTrue();
  });
});
