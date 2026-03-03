# Plan: Fix All Test Coverage Gaps & Bugs

**TL;DR** — Fix 8 lint errors across 4 test files, repair 5 test bugs (placeholder assertions, no-op tests, wrong mock paths), and add 24 new test cases targeting uncovered branches in `App.tsx`, `ImageCapture.tsx`, `DishManager.tsx`, `IngredientManager.tsx`, `useAISuggestion.ts`, `useItemModalFlow.ts`, `useModalBackHandler.ts`, `useDarkMode.ts`, and `NotificationContext.tsx`. Target: ≥95% statements, ≥92% branch coverage.

---

## PHASE 1 — Fix Lint Errors

**1. `src/__tests__/app.test.tsx` line 2**
Remove unused `act` from the import:
- `{ render, screen, fireEvent, waitFor, act }` → `{ render, screen, fireEvent, waitFor }`

**2. `src/__tests__/imageCapture.test.tsx` line 41**
Remove unnecessary type assertion:
- `document.querySelector('input[type="file"]') as HTMLInputElement` → `document.querySelector('input[type="file"]')`

**3. `src/__tests__/useModalBackHandler.test.ts` lines 21, 22, 55, 62, 77, 84**
Replace all 6 `window.` references with `globalThis.`:
- `vi.spyOn(window.history, ...)` → `vi.spyOn(globalThis.history, ...)`
- `window.dispatchEvent(...)` → `globalThis.dispatchEvent(...)`
- `vi.spyOn(window, 'removeEventListener')` → `vi.spyOn(globalThis, 'removeEventListener')`

**4. `src/__tests__/useDarkMode.test.ts` line 114**
Fix unnecessary non-null assertion:
- `changeHandler!()` → `changeHandler?.()` or add null guard `if (changeHandler) changeHandler()`

---

## PHASE 2 — Fix 5 Test Bugs

**5. `src/__tests__/aiSuggestionPreview.test.tsx` line 6**
Fix wrong mock path that silently prevents mocking (resolves 2 levels above `src/__tests__/`):
- `vi.mock('../../hooks/useModalBackHandler', ...)` → `vi.mock('../hooks/useModalBackHandler', ...)`

**6. `src/__tests__/app.test.tsx` — placeholder test**
Replace the test `'handleAnalysisComplete when NOT on ai-analysis tab shows notification'` that contains `expect(true).toBe(true)`:
- Since `AIImageAnalyzer` is unmounted when navigating away from the AI tab, the `if (activeMainTabRef.current !== 'ai-analysis')` branch can't be realistically triggered from a test.
- **Fix:** Add `/* c8 ignore next 3 */` comment in `src/App.tsx` above those 3 lines (lines ~186–191), then delete the placeholder test entirely.

**7. `src/__tests__/useModalBackHandler.test.ts` — no-op test at line ~71**
Test `'popstate calls onClose when programmaticBackCount is 0'` dispatches a `popstate` event but has no assertion.
- **Fix:** Add `expect(mockOnClose).toHaveBeenCalledTimes(1)` at the end.

**8. `src/__tests__/useModalBackHandler.test.ts` — no-op Capacitor test at line ~108**
Test `'Capacitor back button calls exitApp'` rerenders but never triggers the callback or asserts.
- **Fix:** Capture the registered Capacitor `App.addListener('backButton', cb)` callback from `mockAddListener.mock.calls`, then call it with `{ canGoBack: false }`, then assert `expect(mockExitApp).toHaveBeenCalledTimes(1)`.

**9. `src/__tests__/NotificationContext.test.tsx` line ~226**
Test `'pauses auto-dismiss on mouse enter and resumes on mouse leave'` advances timers but has no final assertion.
- **Fix:** After `vi.advanceTimersByTime(2500)`, add `expect(screen.queryByText('Success!')).not.toBeInTheDocument()`.

---

## PHASE 3 — Add New Tests for Coverage Gaps

### 10. `src/__tests__/app.test.tsx` — 3 new tests

**Migration write-back (`needsMigration = true` branch in `useEffect`)**
```ts
it('migrates dishes with empty tags from localStorage on mount', () => {
  localStorage.setItem('mp-dishes', JSON.stringify([
    { id: 'd99', name: 'Old Dish', ingredients: [], tags: [] }
  ]));
  render(<App />);
  expect(screen.getByRole('tablist')).toBeInTheDocument();
  localStorage.removeItem('mp-dishes');
});
```

**Grocery tab renders**
- Add `vi.mock('../components/GroceryList', () => ({ GroceryList: () => <div>GroceryMock</div> }))` at top of file
- Click the grocery nav tab (text "Danh sách mua")
- Assert `screen.getByText('GroceryMock')` is present

**Plan confirmation notification**
- Mock `PlanningModal` to expose "Xác nhận" button that calls `onConfirm(['d1'])`
- Mock `TypeSelectionModal` to call `onSelect('lunch')`
- Open planning modal via calendar tab, confirm, assert `mockNotify.success` called

---

### 11. `src/__tests__/imageCapture.test.tsx` — 5 new tests

**`getUserMedia` rejects (permission denied)**
```ts
it('shows error when getUserMedia rejects', async () => {
  Object.defineProperty(navigator, 'mediaDevices', {
    value: { getUserMedia: vi.fn().mockRejectedValue(new Error('NotAllowedError')) },
    writable: true, configurable: true,
  });
  render(<ImageCapture {...defaultProps} />);
  await act(async () => { fireEvent.click(screen.getByText('Chụp ảnh')); });
  await waitFor(() =>
    expect(screen.getByText(/Không thể truy cập camera/)).toBeInTheDocument()
  );
});
```

**File upload compression fails → fallback to raw data**
```ts
it('falls back to raw data when compression fails on file upload', async () => {
  compressImage.mockRejectedValueOnce(new Error('fail'));
  render(<ImageCapture {...defaultProps} />);
  const input = document.querySelector('input[type="file"]');
  const file = new File(['data'], 'img.png', { type: 'image/png' });
  Object.defineProperty(input, 'files', { value: [file] });
  fireEvent.change(input);
  await waitFor(() => expect(defaultProps.onImageReady).toHaveBeenCalled());
});
```

**Paste compression fails → fallback to raw data**
Same pattern as file upload but via paste event dispatch.

**`capturePhoto` when `getContext` returns null → does nothing**
```ts
it('does nothing when canvas context is null during capturePhoto', async () => {
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null);
  // after opening camera:
  fireEvent.click(screen.getByLabelText('Chụp ảnh'));
  await waitFor(() => expect(defaultProps.onImageReady).not.toHaveBeenCalled());
  expect(screen.getByLabelText('Đóng camera')).toBeInTheDocument();
});
```

**`capturePhoto` compression fails → fallback to raw data URL**
Mock `compressImage.mockRejectedValueOnce`, then click capture, assert `onImageReady` called with uncompressed data URL.

---

### 12. `src/__tests__/dishManager.test.tsx` — 3 new tests

**Submit edit updates existing dish (covers `onUpdate` branch)**
```ts
it('calls onUpdate when submitting edit for existing dish', async () => {
  const editBtn = screen.getAllByTitle('Chỉnh sửa')[0];
  fireEvent.click(editBtn);
  fireEvent.change(screen.getByLabelText('Tên món ăn'), { target: { value: 'Gà nướng mật ong' } });
  fireEvent.click(screen.getByText('Lưu món ăn'));
  expect(defaultProps.onUpdate).toHaveBeenCalledWith(expect.objectContaining({ name: 'Gà nướng mật ong' }));
  expect(defaultProps.onAdd).not.toHaveBeenCalled();
});
```

**View modal shows ingredient details**
Open detail modal for "Gà nướng", assert ingredient name "Ức gà" and amount "200" visible inside modal.

**Sort `ing-desc` — most ingredient count first**
Select `ing-desc` from sort dropdown, assert dish with more ingredients appears before dish with fewer.

---

### 13. `src/__tests__/ingredientManager.test.tsx` — 4 new tests

**Submit edit updates existing ingredient**
Click edit for "Ức gà", change calories to "200", click "Lưu nguyên liệu", assert `onUpdate` called, `onAdd` NOT called.

**"Used in" truncates for 3+ dishes**
Pass 3 dishes all using ingredient `i1`, assert text like "Gà nướng, Cơm gà +1" appears.

**`getDisplayUnit` for `ml` unit**
Add ingredient with `unit: 'ml'`, assert "100ml" appears in the display.

**`getDisplayUnit` for custom unit like `cái`**
Add ingredient with `unit: 'cái'`, assert "1 cái" appears.

---

### 14. `src/__tests__/useAISuggestion.test.ts` — 3 new tests

**`editMeal` on fresh hook (no in-flight request)**
```ts
it('editMeal on fresh hook does not crash and returns mealType', () => {
  const { result } = renderHook(() => useAISuggestion(mockProps));
  let returned: MealType;
  act(() => { returned = result.current.editMeal('lunch'); });
  expect(returned!).toBe('lunch');
  expect(result.current.isModalOpen).toBe(false);
});
```

**`close()` resets loading state**
Start a request that hangs (never resolves), call `close()`, assert `isLoading` becomes false immediately.

**`apply` with all meals false**
Call `apply({ breakfast: false, lunch: false, dinner: false })`, assert the callback receives all-empty dish ID arrays.

---

### 15. `src/__tests__/useItemModalFlow.test.ts` — 1 new test

**Back gesture from direct edit (not cameFromView) closes edit, does not restore view**
```ts
it('back gesture from direct edit (cameFromView=false) closes edit without restoring view', () => {
  let directEditBackCallback: (() => void) | null = null;
  backHandlerMock.mockImplementation((_isOpen, cb) => { directEditBackCallback = cb; });

  const { result } = renderHook(() => useItemModalFlow<TestItem>());
  act(() => result.current.openEdit(itemA));
  expect(result.current.isEditOpen).toBe(true);

  if (directEditBackCallback) act(() => (directEditBackCallback as () => void)());
  expect(result.current.isEditOpen).toBe(false);
  expect(result.current.viewingItem).toBeNull();
  backHandlerMock.mockImplementation(vi.fn());
});
```

---

### 16. `src/__tests__/useModalBackHandler.test.ts` — 2 new tests

**Programmatic close swallows next `popstate` (covers `programmaticBackCount > 0` decrement path)**
```ts
it('swallows the next popstate after programmatic close', () => {
  const { rerender } = renderHook(({ isOpen }) => useModalBackHandler(isOpen, mockOnClose), { initialProps: { isOpen: true } });
  rerender({ isOpen: false });
  globalThis.dispatchEvent(new PopStateEvent('popstate'));
  expect(mockOnClose).not.toHaveBeenCalled();
});
```

**Capacitor listener cleanup on unmount**
```ts
it('removes Capacitor back button listener on unmount', () => {
  mockIsNative.mockReturnValue(true);
  const { unmount } = renderHook(() => useModalBackHandler(true, mockOnClose));
  unmount();
  expect(mockRemove).toHaveBeenCalled();
});
```

---

### 17. `src/__tests__/useDarkMode.test.ts` — 3 new tests

**`localStorage.getItem` throws → defaults to `'system'`**
```ts
it('defaults to system theme when localStorage.getItem throws', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => { throw new DOMException('Blocked'); });
  const { result } = renderHook(() => useDarkMode());
  expect(result.current.theme).toBe('system');
});
```

**`localStorage.setItem` throws → theme still updates in state**
```ts
it('still updates theme state when localStorage.setItem throws', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => { throw new DOMException('Blocked'); });
  const { result } = renderHook(() => useDarkMode());
  act(() => result.current.cycleTheme());
  expect(result.current.theme).not.toBe('system');
});
```

**`matchMedia` unavailable in `useEffect` → no crash**
```ts
it('does not crash when matchMedia is unavailable', () => {
  const original = globalThis.matchMedia;
  Object.defineProperty(globalThis, 'matchMedia', { value: undefined, configurable: true });
  expect(() => renderHook(() => useDarkMode())).not.toThrow();
  Object.defineProperty(globalThis, 'matchMedia', { value: original, configurable: true });
});
```

---

### 18. `src/__tests__/NotificationContext.test.tsx` — 2 new tests

**No overlay button rendered for toast without `onClick`**
```ts
it('does not render overlay button when toast has no onClick', async () => {
  render(<NotificationProvider><TestConsumer /></NotificationProvider>);
  await userEvent.click(screen.getByText('show-success'));
  const toastContainer = screen.getByText('Success!').closest('[class*="rounded-2xl"]');
  const overlayBtn = toastContainer?.querySelector('button[class*="absolute"]');
  expect(overlayBtn).toBeNull();
});
```

**Action button click does NOT trigger `toast.onClick` (stopPropagation)**
```ts
it('action button stopPropagation prevents toast onClick from firing', async () => {
  const toastClick = vi.fn();
  const actionClick = vi.fn();
  const BothConsumer: React.FC = () => {
    const notify = useNotification();
    return (
      <button onClick={() => notify.success('Both', 'msg', {
        onClick: toastClick,
        action: { label: 'Act', onClick: actionClick },
      })}>show-both</button>
    );
  };
  render(<NotificationProvider><BothConsumer /></NotificationProvider>);
  await userEvent.click(screen.getByText('show-both'));
  fireEvent.click(screen.getByText('Act'));
  expect(actionClick).toHaveBeenCalledTimes(1);
  expect(toastClick).not.toHaveBeenCalled();
});
```

---

## Verification

After all changes:

```bash
npm run test -- --coverage
```

Expected results:
| Metric | Before | Target |
|---|---|---|
| Statements | 91.88% | ≥95% |
| Branch | 85.54% | ≥92% |
| Functions | 88.57% | ≥93% |
| Lines | 94.00% | ≥96% |

```bash
npx tsc --noEmit
```
Zero TypeScript errors.

---

## Notes

- **Do NOT create new test files** — all additions go into existing test files to maintain the 38-file structure.
- For the `handleAnalysisComplete` NOT-on-tab path: add `/* c8 ignore next 3 */` in `App.tsx` rather than writing a structurally impossible test.
- The `discardAndBack` with `editingItem = null` path in `useItemModalFlow.ts` is unreachable via the public API — document as `/* c8 ignore next */` defensive code.
- Each new test must rely on `vi.clearAllMocks()` in `beforeEach` to prevent state bleeding between tests.
