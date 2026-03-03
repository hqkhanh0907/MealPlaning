import { renderHook, act } from '@testing-library/react';
import { useItemModalFlow } from '../hooks/useItemModalFlow';
import { useModalBackHandler } from '../hooks/useModalBackHandler';

// Mock useModalBackHandler to prevent history API side effects
vi.mock('../hooks/useModalBackHandler', () => ({
  useModalBackHandler: vi.fn(),
}));

type TestItem = { id: string; name: string };

describe('useItemModalFlow', () => {
  const itemA: TestItem = { id: 'a', name: 'Item A' };

  it('starts with all states closed', () => {
    const { result } = renderHook(() => useItemModalFlow<TestItem>());
    expect(result.current.isEditOpen).toBe(false);
    expect(result.current.editingItem).toBeNull();
    expect(result.current.viewingItem).toBeNull();
    expect(result.current.showUnsavedDialog).toBe(false);
  });

  it('openView sets viewingItem', () => {
    const { result } = renderHook(() => useItemModalFlow<TestItem>());
    act(() => result.current.openView(itemA));
    expect(result.current.viewingItem).toEqual(itemA);
  });

  it('closeView clears viewingItem', () => {
    const { result } = renderHook(() => useItemModalFlow<TestItem>());
    act(() => result.current.openView(itemA));
    act(() => result.current.closeView());
    expect(result.current.viewingItem).toBeNull();
  });

  it('openEdit opens edit modal with item', () => {
    const { result } = renderHook(() => useItemModalFlow<TestItem>());
    act(() => result.current.openEdit(itemA));
    expect(result.current.isEditOpen).toBe(true);
    expect(result.current.editingItem).toEqual(itemA);
  });

  it('openEdit without item sets editingItem to null', () => {
    const { result } = renderHook(() => useItemModalFlow<TestItem>());
    act(() => result.current.openEdit());
    expect(result.current.isEditOpen).toBe(true);
    expect(result.current.editingItem).toBeNull();
  });

  it('openEditFromView transitions from view to edit', () => {
    const { result } = renderHook(() => useItemModalFlow<TestItem>());
    act(() => result.current.openView(itemA));
    act(() => result.current.openEditFromView(itemA));
    expect(result.current.isEditOpen).toBe(true);
    expect(result.current.editingItem).toEqual(itemA);
    expect(result.current.viewingItem).toBeNull();
  });

  it('closeEdit without changes from view returns to view', () => {
    const { result } = renderHook(() => useItemModalFlow<TestItem>());
    act(() => result.current.openView(itemA));
    act(() => result.current.openEditFromView(itemA));
    act(() => result.current.closeEdit(false)); // no form changes
    expect(result.current.isEditOpen).toBe(false);
    expect(result.current.viewingItem).toEqual(itemA);
  });

  it('closeEdit with changes from view shows unsaved dialog', () => {
    const { result } = renderHook(() => useItemModalFlow<TestItem>());
    act(() => result.current.openView(itemA));
    act(() => result.current.openEditFromView(itemA));
    act(() => result.current.closeEdit(true)); // has form changes
    expect(result.current.showUnsavedDialog).toBe(true);
    expect(result.current.isEditOpen).toBe(true); // still open
  });

  it('discardAndBack closes edit and returns to view', () => {
    const { result } = renderHook(() => useItemModalFlow<TestItem>());
    act(() => result.current.openView(itemA));
    act(() => result.current.openEditFromView(itemA));
    act(() => result.current.closeEdit(true));
    act(() => result.current.discardAndBack());
    expect(result.current.showUnsavedDialog).toBe(false);
    expect(result.current.isEditOpen).toBe(false);
    expect(result.current.viewingItem).toEqual(itemA);
  });

  it('confirmSaveAndBack closes edit and shows saved item in view', () => {
    const { result } = renderHook(() => useItemModalFlow<TestItem>());
    act(() => result.current.openView(itemA));
    act(() => result.current.openEditFromView(itemA));
    act(() => result.current.closeEdit(true));
    const savedItem = { ...itemA, name: 'Updated' };
    act(() => result.current.confirmSaveAndBack(savedItem));
    expect(result.current.showUnsavedDialog).toBe(false);
    expect(result.current.isEditOpen).toBe(false);
    expect(result.current.viewingItem).toEqual(savedItem);
  });

  it('afterSubmit closes edit and shows saved item in view when came from view', () => {
    const { result } = renderHook(() => useItemModalFlow<TestItem>());
    act(() => result.current.openView(itemA));
    act(() => result.current.openEditFromView(itemA));
    const savedItem = { ...itemA, name: 'Saved' };
    act(() => result.current.afterSubmit(savedItem));
    expect(result.current.isEditOpen).toBe(false);
    expect(result.current.viewingItem).toEqual(savedItem);
  });

  it('afterSubmit closes edit without opening view when not from view', () => {
    const { result } = renderHook(() => useItemModalFlow<TestItem>());
    act(() => result.current.openEdit(itemA));
    act(() => result.current.afterSubmit(itemA));
    expect(result.current.isEditOpen).toBe(false);
    expect(result.current.viewingItem).toBeNull();
  });

  it('closeEdit from direct edit (not from view) just closes', () => {
    const { result } = renderHook(() => useItemModalFlow<TestItem>());
    act(() => result.current.openEdit(itemA));
    act(() => result.current.closeEdit(true)); // even with changes
    expect(result.current.isEditOpen).toBe(false);
    expect(result.current.showUnsavedDialog).toBe(false);
  });

  it('dismissUnsavedDialog hides the dialog', () => {
    const { result } = renderHook(() => useItemModalFlow<TestItem>());
    act(() => result.current.openView(itemA));
    act(() => result.current.openEditFromView(itemA));
    act(() => result.current.closeEdit(true));
    expect(result.current.showUnsavedDialog).toBe(true);
    act(() => result.current.dismissUnsavedDialog());
    expect(result.current.showUnsavedDialog).toBe(false);
  });

  it('calls onOpenEdit callback when provided', () => {
    const onOpenEdit = vi.fn();
    const { result } = renderHook(() => useItemModalFlow<TestItem>({ onOpenEdit }));
    act(() => result.current.openEdit(itemA));
    expect(onOpenEdit).toHaveBeenCalledWith(itemA);
  });

  it('back gesture from edit-in-view returns to view without unsaved dialog', () => {
    // Capture the second useModalBackHandler call (edit modal back handler)
    const backHandlerMock = vi.mocked(useModalBackHandler);
    let editBackCallback: (() => void) | null = null;
    backHandlerMock.mockImplementation((_isOpen, callback) => {
      // The second call (isEditOpen handler) is what we capture
      editBackCallback = callback;
    });

    const { result } = renderHook(() => useItemModalFlow<TestItem>());

    // Open view → then edit from view
    act(() => result.current.openView(itemA));
    act(() => result.current.openEditFromView(itemA));
    expect(result.current.isEditOpen).toBe(true);
    expect(result.current.viewingItem).toBeNull(); // cleared during edit-from-view

    // Simulate back gesture while in edit-from-view (cameFromView=true, editingItem set)
    if (editBackCallback) {
      act(() => (editBackCallback as () => void)());
    }

    // Should close edit and restore view
    expect(result.current.isEditOpen).toBe(false);
    expect(result.current.viewingItem).toBe(itemA);

    // Restore the mock
    backHandlerMock.mockImplementation(vi.fn());
  });
});
