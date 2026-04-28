import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchToolbar } from './search-toolbar';

describe('SearchToolbarComponent', () => {
  let fixture: ComponentFixture<SearchToolbar>;
  let component: SearchToolbar;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchToolbar],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchToolbar);
    component = fixture.componentInstance;
    component.placeholder = 'Tìm nguyên liệu';
    fixture.detectChanges();
  });

  it('renders placeholder text', () => {
    const input = fixture.nativeElement.querySelector('.search-input') as HTMLInputElement;
    expect(input.placeholder).toBe('Tìm nguyên liệu');
  });

  it('emits queryChange when user types', () => {
    let captured = '';
    component.queryChange.subscribe((value: string) => {
      captured = value;
    });

    component.onInput('trứng');

    expect(captured).toBe('trứng');
  });

  it('emits empty query when clear is pressed', () => {
    fixture.componentRef.setInput('query', 'trứng');
    fixture.detectChanges();

    let captured = 'unchanged';
    component.queryChange.subscribe((value: string) => {
      captured = value;
    });

    component.clear();

    expect(captured).toBe('');
  });
});
