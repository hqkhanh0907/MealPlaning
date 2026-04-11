import { ChefHat, Edit3, Minus, Plus, Trash2, UtensilsCrossed } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { MEAL_TYPE_ICON_COLORS, MEAL_TYPE_ICONS } from '../../data/constants';
import { Dish, MealType, SlotInfo, SupportedLang } from '../../types';
import { getLocalizedField } from '../../utils/localize';
import { ConfirmationModal } from '../modals/ConfirmationModal';

export interface MealSlotProps {
  type: MealType;
  slot: SlotInfo;
  dishes: Dish[];
  servings?: Record<string, number>;
  onEdit: () => void;
  onUpdateServings?: (dishId: string, servings: number) => void;
  onClearMeal?: () => void;
  isSwipeOpen?: boolean;
  onSwipeOpen?: () => void;
  onSwipeClose?: () => void;
}

const MAX_VISIBLE_DISHES = 4;

const TEST_ID_MAP: Record<MealType, string> = {
  breakfast: 'meal-slot-breakfast',
  lunch: 'meal-slot-lunch',
  dinner: 'meal-slot-dinner',
};

const MEAL_BORDER_COLOR: Record<MealType, string> = {
  breakfast: 'border-l-meal-breakfast',
  lunch: 'border-l-meal-lunch',
  dinner: 'border-l-meal-dinner',
};

export const MealSlot = React.memo(function MealSlot({
  type,
  slot,
  dishes,
  servings,
  onEdit,
  onUpdateServings,
  onClearMeal,
  isSwipeOpen,
  onSwipeOpen,
  onSwipeClose,
}: MealSlotProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as SupportedLang;
  const hasDishes = slot.dishIds.length > 0;
  const MealIcon = MEAL_TYPE_ICONS[type];
  const label = t(`meal.${type}`);
  const [expanded, setExpanded] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const currentX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const SWIPE_THRESHOLD = 50;
  const REVEAL_WIDTH = 80;

  const getTransitionDuration = useCallback(() => {
    const prefersReduced = globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return prefersReduced ? '0ms' : '200ms';
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = false;
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const diffX = touchStartX.current - e.touches[0].clientX;
      const diffY = Math.abs(e.touches[0].clientY - touchStartY.current);

      if (diffY > Math.abs(diffX)) return;

      if (diffX <= 0) {
        if (isSwipeOpen && containerRef.current) {
          const closeProgress = Math.max(0, REVEAL_WIDTH + diffX);
          containerRef.current.style.transform = `translateX(-${closeProgress}px)`;
          isDragging.current = true;
        }
        return;
      }

      isDragging.current = true;
      const capped = isSwipeOpen ? REVEAL_WIDTH : Math.min(diffX, REVEAL_WIDTH);
      currentX.current = capped;

      if (containerRef.current) {
        containerRef.current.style.transform = `translateX(-${capped}px)`;
      }
    },
    [isSwipeOpen],
  );

  const applyTransition = useCallback(
    (el: HTMLDivElement, transform: string) => {
      const duration = getTransitionDuration();
      el.style.transition = `transform ${duration} cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
      el.style.transform = transform;
    },
    [getTransitionDuration],
  );

  const clearTransitionAfterAnimate = useCallback(() => {
    setTimeout(() => {
      if (containerRef.current) containerRef.current.style.transition = '';
    }, 200);
  }, []);

  const resolveSwipeSnap = useCallback(
    (el: HTMLDivElement): { transform: string; triggerClose: boolean; triggerOpen: boolean } => {
      const isNewSwipe = currentX.current >= SWIPE_THRESHOLD && !isSwipeOpen;
      if (isNewSwipe) {
        return { transform: `translateX(-${REVEAL_WIDTH}px)`, triggerClose: false, triggerOpen: true };
      }

      if (isSwipeOpen && isDragging.current) {
        const current = Math.abs(new DOMMatrixReadOnly(getComputedStyle(el).transform).m41);
        const shouldClose = current < SWIPE_THRESHOLD;
        return {
          transform: shouldClose ? 'translateX(0)' : `translateX(-${REVEAL_WIDTH}px)`,
          triggerClose: shouldClose,
          triggerOpen: false,
        };
      }

      return {
        transform: isSwipeOpen ? `translateX(-${REVEAL_WIDTH}px)` : 'translateX(0)',
        triggerClose: !isSwipeOpen,
        triggerOpen: false,
      };
    },
    [isSwipeOpen],
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current && !isSwipeOpen) return;

    const el = containerRef.current;
    if (!el) return;

    const snap = resolveSwipeSnap(el);
    applyTransition(el, snap.transform);
    if (snap.triggerOpen) onSwipeOpen?.();
    if (snap.triggerClose) onSwipeClose?.();

    clearTransitionAfterAnimate();
    isDragging.current = false;
    currentX.current = 0;
  }, [isSwipeOpen, onSwipeOpen, onSwipeClose, applyTransition, clearTransitionAfterAnimate, resolveSwipeSnap]);

  useEffect(() => {
    if (!isSwipeOpen && containerRef.current) {
      const duration = getTransitionDuration();
      containerRef.current.style.transition =
        duration === '0ms' ? '' : `transform ${duration} cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
      containerRef.current.style.transform = 'translateX(0)';
      const ref = containerRef.current;
      const timer = setTimeout(() => {
        if (ref) ref.style.transition = '';
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isSwipeOpen, getTransitionDuration]);

  const handleClearConfirm = useCallback(() => {
    onClearMeal?.();
    setShowConfirm(false);
    onSwipeClose?.();
  }, [onClearMeal, onSwipeClose]);

  const handleClearCancel = useCallback(() => {
    setShowConfirm(false);
  }, []);

  const resolvedDishes = useMemo(() => {
    const map = new Map(dishes.map(d => [d.id, d]));
    return slot.dishIds.map(id => map.get(id)).filter((d): d is Dish => d !== undefined);
  }, [slot.dishIds, dishes]);

  const handleServingChange = useCallback(
    (dishId: string, delta: number) => {
      const current = servings?.[dishId] ?? 1;
      const next = Math.max(1, Math.min(10, current + delta));
      onUpdateServings?.(dishId, next);
    },
    [servings, onUpdateServings],
  );

  const dishCount = resolvedDishes.length;
  const visibleDishes = expanded ? resolvedDishes : resolvedDishes.slice(0, MAX_VISIBLE_DISHES);
  const extraCount = dishCount - MAX_VISIBLE_DISHES;

  const slotAriaLabel = t('calendar.meal.slotLabel', {
    type: label,
    count: dishCount,
    cal: Math.round(slot.calories),
  });

  if (!hasDishes) {
    return (
      <section
        data-testid={TEST_ID_MAP[type]}
        aria-label={slotAriaLabel}
        className={`border-l-[3px] ${MEAL_BORDER_COLOR[type]} border-border flex flex-col items-center gap-2 rounded-xl border border-dashed p-4`}
      >
        <UtensilsCrossed className={`size-6 ${MEAL_TYPE_ICON_COLORS[type]}`} aria-hidden="true" />
        <span className="text-foreground text-sm font-medium">{label}</span>
        <span className="text-muted-foreground text-xs">{t('calendar.meal.emptySlot')}</span>
        <button
          type="button"
          onClick={onEdit}
          aria-label={t('calendar.addDishForMeal', { meal: label })}
          className="text-primary hover:bg-primary-subtle flex min-h-11 items-center gap-1 rounded-lg px-3 text-sm font-medium transition-colors active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          {t('calendar.meal.addCTA')}
        </button>
      </section>
    );
  }

  return (
    <section data-testid={TEST_ID_MAP[type]} aria-label={slotAriaLabel} className="relative overflow-hidden rounded-xl">
      {/* Destructive zone (behind content) */}
      <div
        data-testid={`swipe-delete-${type}`}
        className="bg-destructive text-destructive-foreground absolute inset-y-0 right-0 flex w-20 items-center justify-center"
      >
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          aria-label={t('calendar.meal.clearSlot', { type: label })}
          className="flex h-full w-full flex-col items-center justify-center gap-1"
        >
          <Trash2 className="h-5 w-5" aria-hidden="true" />
          <span className="text-xs font-medium">{t('common.delete')}</span>
        </button>
      </div>

      {/* Content (draggable) */}
      <div
        ref={containerRef}
        onTouchStart={hasDishes ? handleTouchStart : undefined}
        onTouchMove={hasDishes ? handleTouchMove : undefined}
        onTouchEnd={hasDishes ? handleTouchEnd : undefined}
        className={`border-l-[3px] ${MEAL_BORDER_COLOR[type]} bg-card border-border-subtle relative rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md`}
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <MealIcon className={`size-5 shrink-0 ${MEAL_TYPE_ICON_COLORS[type]}`} aria-hidden="true" />
            <span className="text-muted-foreground shrink-0 text-xs font-semibold tracking-wider uppercase">
              {label}
            </span>
            <span className="text-muted-foreground truncate text-xs tabular-nums">
              {Math.round(slot.calories)} kcal · {Math.round(slot.protein)}g
            </span>
          </div>
          <button
            type="button"
            onClick={onEdit}
            aria-label={`${t('common.edit')} ${label}`}
            className="hover:text-primary hover:bg-primary-subtle text-muted-foreground flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg p-2 transition-all sm:min-h-9 sm:min-w-9"
          >
            <Edit3 className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-2 space-y-1">
          {visibleDishes.map(d => {
            const s = servings?.[d.id] ?? 1;
            return (
              <div key={d.id} className="flex items-center gap-2">
                <ChefHat className="text-primary h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="text-foreground flex-1 truncate text-sm font-medium">
                  {getLocalizedField(d.name, lang)}
                </span>
                {onUpdateServings && (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      data-testid={`btn-serving-minus-${d.id}`}
                      onClick={() => handleServingChange(d.id, -1)}
                      disabled={s <= 1}
                      aria-label={`${t('common.decrease')} ${getLocalizedField(d.name, lang)}`}
                      className="hover:text-primary text-muted-foreground hover:bg-primary-subtle flex min-h-11 min-w-11 items-center justify-center rounded-lg transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span
                      data-testid={`serving-count-${d.id}`}
                      className="text-muted-foreground min-w-[18px] text-center text-xs font-semibold"
                    >
                      {s}x
                    </span>
                    <button
                      type="button"
                      data-testid={`btn-serving-plus-${d.id}`}
                      onClick={() => handleServingChange(d.id, 1)}
                      disabled={s >= 10}
                      aria-label={`${t('common.increase')} ${getLocalizedField(d.name, lang)}`}
                      className="hover:text-primary text-muted-foreground hover:bg-primary-subtle flex min-h-11 min-w-11 items-center justify-center rounded-lg transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {extraCount > 0 && !expanded && (
            <button type="button" onClick={() => setExpanded(true)} className="text-primary ml-5.5 text-xs font-medium">
              {t('calendar.meal.moreCount', { count: extraCount })}
            </button>
          )}
        </div>

        <div className="border-border flex flex-wrap items-center gap-2 border-t pt-2">
          <span className="text-energy-emphasis text-sm font-bold tabular-nums">{Math.round(slot.calories)} kcal</span>
          <span className="bg-macro-protein/10 text-macro-protein rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums">
            P {Math.round(slot.protein)}g
          </span>
          <span className="bg-macro-fat/10 text-macro-fat rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums">
            F {Math.round(slot.fat)}g
          </span>
          <span className="bg-macro-carbs/10 text-macro-carbs rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums">
            C {Math.round(slot.carbs)}g
          </span>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirm}
        onCancel={handleClearCancel}
        onConfirm={handleClearConfirm}
        title={t('calendar.meal.clearConfirmTitle', { type: label })}
        message={t('calendar.meal.clearConfirmDesc', { type: label })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        variant="danger"
      />
    </section>
  );
});

MealSlot.displayName = 'MealSlot';
