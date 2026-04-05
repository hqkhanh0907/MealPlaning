import type { ReactNode } from 'react';

/**
 * Renders an accessible explanation for why an element is disabled.
 * On mobile, `title` tooltips don't work (no hover), so this provides
 * a visible, screen-reader-accessible alternative via `aria-describedby`.
 *
 * Usage:
 * ```tsx
 * <Button disabled={!canSave} aria-describedby={!canSave ? 'save-reason' : undefined}>
 *   Lưu
 * </Button>
 * <DisabledReason id="save-reason" reason="Chưa có thay đổi nào" show={!canSave} />
 * ```
 */
export function DisabledReason({
  id,
  reason,
  show,
  className,
}: {
  id: string;
  reason: ReactNode;
  show: boolean;
  className?: string;
}) {
  if (!show) return null;
  return (
    <p id={id} className={`text-muted-foreground mt-1 text-xs ${className ?? ''}`}>
      {reason}
    </p>
  );
}
