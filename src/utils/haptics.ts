import type { ImpactStyle as ImpactStyleType } from '@capacitor/haptics';

type FeedbackIntensity = 'light' | 'medium' | 'heavy';

const IMPACT_STYLE_MAP: Record<FeedbackIntensity, string> = {
  light: 'Light',
  medium: 'Medium',
  heavy: 'Heavy',
};

/**
 * Triggers haptic feedback via the Capacitor Haptics plugin.
 * Silently no-ops when the plugin is unavailable (e.g. in web browsers).
 */
export async function hapticFeedback(type: FeedbackIntensity): Promise<void> {
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    const style = IMPACT_STYLE_MAP[type] as keyof typeof ImpactStyle;
    await Haptics.impact({ style: ImpactStyle[style] as ImpactStyleType });
  } catch {
    // Haptics plugin not available — graceful no-op
  }
}

/** Light haptic feedback for button taps */
export function tapFeedback(): void {
  void hapticFeedback('light');
}

/** Medium haptic feedback for success actions */
export function successFeedback(): void {
  void hapticFeedback('medium');
}

/** Heavy haptic feedback for error states */
export function errorFeedback(): void {
  void hapticFeedback('heavy');
}
