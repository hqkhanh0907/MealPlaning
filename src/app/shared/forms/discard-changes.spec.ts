import { DiscardChanges } from './discard-changes';

describe('discarding unsaved form changes', () => {
  it('resolves two back actions with the same answer and reopens for later edits', async () => {
    const dialog = new DiscardChanges();
    const first = dialog.request();
    const second = dialog.request();
    expect(dialog.open()).toBeTrue();
    dialog.answer(false);
    expect(await Promise.all([first, second])).toEqual([false, false]);
    const next = dialog.request();
    dialog.answer(true);
    expect(await next).toBeTrue();
    expect(dialog.open()).toBeFalse();
  });
});
