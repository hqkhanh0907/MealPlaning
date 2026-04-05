/**
 * UnitSelector — reusable dropdown for ingredient unit with
 * a built-in "Khác..." fallback that reveals a free-text input.
 *
 * Supports two modes:
 * 'single' — value is a plain string (SaveAnalyzedDishModal, etc.)
 * 'bilingual'— value is {vi: string, en: string} (IngredientEditModal,
 * DishEditModal quick-add)
 *
 * Common units are presented as select <option>s. When the current value
 * is not in the list (e.g. AI-prefilled "tbsp"), the component auto-
 * selects "Khác..." and shows the text input pre-filled with that value.
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';

import { COMMON_UNITS } from '../../data/units';

const CUSTOM_VALUE = '__custom__';

/** Resolve which select option matches the current value string. */
function resolveSelectVal(viValue: string): string {
  if (!viValue) return '';
  const matched = COMMON_UNITS.find(u => u.vi === viValue || u.en === viValue);
  return matched ? matched.vi : CUSTOM_VALUE;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface BaseProps {
  /** Extra class applied to the outer wrapper <div>. */
  className?: string;
  /** Show error state (red border). */
  error?: boolean;
  onBlur?: () => void;
  'data-testid'?: string;
  /** id forwarded to the <select> element so a <label htmlFor> works. */
  id?: string;
}

interface SingleProps extends BaseProps {
  mode: 'single';
  value: string;
  onChange: (value: string) => void;
}

interface BilingualProps extends BaseProps {
  mode: 'bilingual';
  value: { vi: string; en?: string };
  onChange: (value: { vi: string; en?: string }) => void;
}

type UnitSelectorProps = SingleProps | BilingualProps;

// ─── Component ────────────────────────────────────────────────────────────────

export const UnitSelector = (props: UnitSelectorProps) => {
  const { className = '', error = false, onBlur, id } = props;
  const { t } = useTranslation();
  const currentVi = props.mode === 'single' ? props.value : props.value.vi;

  const [selectVal, setSelectVal] = useState<string>(() => resolveSelectVal(currentVi));
  const [customText, setCustomText] = useState<string>(() =>
    resolveSelectVal(currentVi) === CUSTOM_VALUE ? currentVi : '',
  );

  // Sync derived state when currentVi changes from parent (e.g. AI fills).
  // React-idiomatic: setState during render based on previous prop comparison
  // is preferred over useEffect for purely-derived state.
  const [prevVi, setPrevVi] = useState(currentVi);
  if (prevVi !== currentVi) {
    setPrevVi(currentVi);
    const resolved = resolveSelectVal(currentVi);
    setSelectVal(resolved);
    setCustomText(resolved === CUSTOM_VALUE ? currentVi : '');
  }

  // ── Emit change up ──────────────────────────────────────────────────────────
  const emit = (vi: string) => {
    if (props.mode === 'single') {
      props.onChange(vi);
    } else {
      props.onChange({ vi });
    }
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectVal(val);
    if (val === '' || val === CUSTOM_VALUE) {
      setCustomText('');
      emit('');
    } else {
      const unit = COMMON_UNITS.find(u => u.vi === val);
      if (unit) emit(unit.vi);
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomText(val);
    emit(val);
  };

  // ── Shared classes ──────────────────────────────────────────────────────────
  const inputBase =
    'w-full px-4 py-2.5 rounded-xl border focus:border-primary outline-none ' +
    'transition-all text-base sm:text-sm bg-card ';
  const borderClass = error ? 'border-destructive' : 'border-border';

  const testId = props['data-testid'];

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Dropdown */}
      <select
        id={id}
        value={selectVal}
        onChange={handleSelectChange}
        onBlur={onBlur}
        data-testid={testId ? `${testId}-select` : undefined}
        className={inputBase + borderClass + ' cursor-pointer'}
      >
        <option value="">{t('shared.unitSelectorDefault')}</option>
        {COMMON_UNITS.map(u => (
          <option key={u.vi} value={u.vi}>
            {u.label ?? u.vi}
          </option>
        ))}
        <option value={CUSTOM_VALUE}>{t('shared.unitSelectorCustom')}</option>
      </select>

      {/* Free-text input shown only when "Khác..." is selected */}
      {selectVal === CUSTOM_VALUE && (
        <Input
          type="text"
          value={customText}
          onChange={handleCustomChange}
          onBlur={onBlur}
          placeholder={t('shared.unitSelectorCustomPlaceholder')}
          data-testid={testId ? `${testId}-custom` : undefined}
          className={error ? 'border-destructive w-full' : 'w-full'}
          autoFocus
        />
      )}
    </div>
  );
};
