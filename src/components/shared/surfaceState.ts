export const CANONICAL_SURFACE_STATES = ['zero', 'empty', 'setup', 'loading', 'success', 'warning', 'error'] as const;

export type CanonicalSurfaceState = (typeof CANONICAL_SURFACE_STATES)[number];

export type SurfaceValidationMode = 'optional' | 'required';
export type PrimaryActionRequirement = 'optional' | 'required';

export interface SurfaceCopyContract {
  title?: string;
  missing?: string;
  reason?: string;
  nextStep?: string;
}

export interface SurfacePrimaryAction {
  label: string;
  onAction?: () => void;
}

export interface SurfaceDefinition {
  allowedStates: readonly CanonicalSurfaceState[];
  validation: SurfaceValidationMode;
  primaryAction: PrimaryActionRequirement;
  allowsExternalPrimaryAction?: true;
  copyContract: 'missing-reason-next-step';
  distinguishSetupFromZero: true;
}

export const SURFACE_STATE_MATRIX = {
  'shell.startup': {
    allowedStates: ['setup', 'loading', 'warning', 'error', 'success'],
    validation: 'optional',
    primaryAction: 'optional',
    copyContract: 'missing-reason-next-step',
    distinguishSetupFromZero: true,
  },
  'dashboard.hero': {
    allowedStates: ['setup', 'loading', 'success', 'warning', 'error', 'zero'],
    validation: 'optional',
    primaryAction: 'optional',
    copyContract: 'missing-reason-next-step',
    distinguishSetupFromZero: true,
  },
  'dashboard.todays-plan': {
    allowedStates: ['setup', 'empty', 'loading', 'success', 'warning', 'error'],
    validation: 'optional',
    primaryAction: 'required',
    copyContract: 'missing-reason-next-step',
    distinguishSetupFromZero: true,
  },
  'calendar.nutrition': {
    allowedStates: ['setup', 'empty', 'loading', 'success', 'warning', 'error', 'zero'],
    validation: 'optional',
    primaryAction: 'required',
    copyContract: 'missing-reason-next-step',
    distinguishSetupFromZero: true,
  },
  'calendar.meals': {
    allowedStates: ['empty', 'loading', 'success', 'warning', 'error'],
    validation: 'optional',
    primaryAction: 'required',
    copyContract: 'missing-reason-next-step',
    distinguishSetupFromZero: true,
  },
  'fitness.plan': {
    allowedStates: ['setup', 'empty', 'loading', 'success', 'warning', 'error'],
    validation: 'required',
    primaryAction: 'required',
    copyContract: 'missing-reason-next-step',
    distinguishSetupFromZero: true,
  },
  'settings.goal': {
    allowedStates: ['setup', 'loading', 'success', 'warning', 'error', 'zero'],
    validation: 'required',
    primaryAction: 'required',
    allowsExternalPrimaryAction: true,
    copyContract: 'missing-reason-next-step',
    distinguishSetupFromZero: true,
  },
  'settings.healthProfile': {
    allowedStates: ['setup', 'loading', 'success', 'warning', 'error', 'zero'],
    validation: 'required',
    primaryAction: 'required',
    allowsExternalPrimaryAction: true,
    copyContract: 'missing-reason-next-step',
    distinguishSetupFromZero: true,
  },
  'settings.trainingProfile': {
    allowedStates: ['setup', 'loading', 'success', 'warning', 'error'],
    validation: 'optional',
    primaryAction: 'required',
    allowsExternalPrimaryAction: true,
    copyContract: 'missing-reason-next-step',
    distinguishSetupFromZero: true,
  },
  'library.dishes': {
    allowedStates: ['empty', 'loading', 'success', 'warning', 'error'],
    validation: 'optional',
    primaryAction: 'required',
    copyContract: 'missing-reason-next-step',
    distinguishSetupFromZero: true,
  },
  'library.ingredients': {
    allowedStates: ['empty', 'loading', 'success', 'warning', 'error'],
    validation: 'optional',
    primaryAction: 'required',
    copyContract: 'missing-reason-next-step',
    distinguishSetupFromZero: true,
  },
  'ai.analysis': {
    allowedStates: ['empty', 'loading', 'success', 'warning', 'error'],
    validation: 'optional',
    primaryAction: 'required',
    allowsExternalPrimaryAction: true,
    copyContract: 'missing-reason-next-step',
    distinguishSetupFromZero: true,
  },
  'overlay.filter-sheet': {
    allowedStates: ['success', 'warning'],
    validation: 'optional',
    primaryAction: 'optional',
    copyContract: 'missing-reason-next-step',
    distinguishSetupFromZero: true,
  },
  'overlay.day-assignment': {
    allowedStates: ['success', 'warning'],
    validation: 'optional',
    primaryAction: 'optional',
    copyContract: 'missing-reason-next-step',
    distinguishSetupFromZero: true,
  },
} as const satisfies Record<string, SurfaceDefinition>;

export type SurfaceId = keyof typeof SURFACE_STATE_MATRIX;

export interface SurfaceStateContract {
  surface: SurfaceId;
  state: CanonicalSurfaceState;
  copy: SurfaceCopyContract;
  primaryAction?: SurfacePrimaryAction;
}

export interface ResolveSurfaceStateInput {
  isLoading?: boolean;
  hasError?: boolean;
  isConfigured?: boolean;
  hasWarning?: boolean;
  isEmpty?: boolean;
  isZero?: boolean;
}

export interface ValidationGateInput {
  required: boolean;
  hasValue: boolean;
}

export function resolveCanonicalSurfaceState({
  isLoading = false,
  hasError = false,
  isConfigured = true,
  hasWarning = false,
  isEmpty = false,
  isZero = false,
}: ResolveSurfaceStateInput): CanonicalSurfaceState {
  if (isLoading) return 'loading';
  if (hasError) return 'error';
  if (!isConfigured) return 'setup';
  if (hasWarning) return 'warning';
  if (isEmpty) return 'empty';
  if (isZero) return 'zero';
  return 'success';
}

export function buildStateDescription(copy: SurfaceCopyContract): string | undefined {
  const parts = [
    copy.missing ? `Thiếu: ${copy.missing}` : null,
    copy.reason ? `Lý do: ${copy.reason}` : null,
    copy.nextStep ? `Tiếp theo: ${copy.nextStep}` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' · ') : undefined;
}

export function shouldBlockForRequiredValue({ required, hasValue }: ValidationGateInput): boolean {
  return required && !hasValue;
}

export function createSurfaceStateContract(contract: SurfaceStateContract): SurfaceStateContract {
  const definition = SURFACE_STATE_MATRIX[contract.surface] as SurfaceDefinition;

  if (!definition.allowedStates.includes(contract.state)) {
    throw new Error(`State "${contract.state}" is not allowed for surface "${contract.surface}"`);
  }

  if (definition.primaryAction === 'required' && !definition.allowsExternalPrimaryAction && !contract.primaryAction) {
    throw new Error(`Surface "${contract.surface}" requires one primary action`);
  }

  return contract;
}
