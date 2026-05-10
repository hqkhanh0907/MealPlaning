import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmEatModal, type ConfirmEatMode } from './confirm-eat-modal';

describe('ConfirmEatModal', () => {
  let fixture: ComponentFixture<ConfirmEatModal>;
  let component: ConfirmEatModal;

  function setInputs(mode: ConfirmEatMode, dishName = 'Phở bò', isOpen = true): void {
    fixture.componentRef.setInput('isOpen', isOpen);
    fixture.componentRef.setInput('dishName', dishName);
    fixture.componentRef.setInput('mode', mode);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ConfirmEatModal] });
    fixture = TestBed.createComponent(ConfirmEatModal);
    component = fixture.componentInstance;
  });

  describe('mark mode', () => {
    it('builds title with dish name', () => {
      setInputs('mark', 'Cơm tấm');
      expect(component.title()).toBe('Đánh dấu "Cơm tấm" đã ăn?');
    });

    it('uses fixed body explaining snapshot', () => {
      setInputs('mark');
      expect(component.body()).toBe('Số liệu sẽ được lưu cố định.');
    });

    it('exposes hybrid microcopy', () => {
      setInputs('mark');
      expect(component.hybridMicrocopy()).toContain('snapshot');
    });
  });

  describe('unmark mode', () => {
    it('builds title with dish name', () => {
      setInputs('unmark', 'Bún bò Huế');
      expect(component.title()).toBe('Bỏ đánh dấu "Bún bò Huế"?');
    });

    it('uses fixed body explaining revert to realtime', () => {
      setInputs('unmark');
      expect(component.body()).toBe('Số liệu hiện tại sẽ bị xoá và quay về realtime theo recipe.');
    });

    it('does NOT show hybrid microcopy', () => {
      setInputs('unmark');
      expect(component.hybridMicrocopy()).toBeNull();
    });
  });

  describe('confirm/cancel outputs', () => {
    it('emits confirm when emit(true) is called', () => {
      setInputs('mark');
      const confirmSpy = jasmine.createSpy('confirm');
      const cancelSpy = jasmine.createSpy('cancel');
      component.confirmed.subscribe(confirmSpy);
      component.cancelled.subscribe(cancelSpy);
      component.emit(true);
      expect(confirmSpy).toHaveBeenCalledTimes(1);
      expect(cancelSpy).not.toHaveBeenCalled();
    });

    it('emits cancel when emit(false) is called', () => {
      setInputs('mark');
      const confirmSpy = jasmine.createSpy('confirm');
      const cancelSpy = jasmine.createSpy('cancel');
      component.confirmed.subscribe(confirmSpy);
      component.cancelled.subscribe(cancelSpy);
      component.emit(false);
      expect(cancelSpy).toHaveBeenCalledTimes(1);
      expect(confirmSpy).not.toHaveBeenCalled();
    });
  });

  describe('rendered DOM', () => {
    it('renders nothing when isOpen=false', () => {
      setInputs('mark', 'Phở', false);
      const dialog = (fixture.nativeElement as HTMLElement).querySelector('.dialog');
      expect(dialog).toBeNull();
    });

    it('renders [Hủy] and [Xác nhận] buttons with min-height for tap target', () => {
      setInputs('mark');
      const cancel = (fixture.nativeElement as HTMLElement).querySelector('.dialog-btn-cancel');
      const confirm = (fixture.nativeElement as HTMLElement).querySelector('.dialog-btn-primary');
      expect(cancel?.textContent?.trim()).toBe('Hủy');
      expect(confirm?.textContent?.trim()).toBe('Xác nhận');
    });

    it('renders microcopy paragraph in mark mode only', () => {
      setInputs('mark');
      const markMicro = (fixture.nativeElement as HTMLElement).querySelector('.dialog-microcopy');
      expect(markMicro).toBeTruthy();

      setInputs('unmark');
      const unmarkMicro = (fixture.nativeElement as HTMLElement).querySelector('.dialog-microcopy');
      expect(unmarkMicro).toBeNull();
    });
  });
});
