# ADR 003: Internationalization with i18next

## Status
Accepted

## Date
2025-01-01

## Context
The app was initially built with hardcoded Vietnamese strings. To support potential multi-language use and follow the "global i18n from day one" principle, we needed an internationalization solution.

Options considered:
1. **react-intl** (FormatJS) — ICU message format, heavier bundle.
2. **react-i18next** — lightweight, plugin ecosystem, widely adopted in React.
3. **Custom solution** — simple key-value map, no tooling support.

## Decision
Use **react-i18next** with `i18next` core library.

## Rationale
- **Ecosystem**: Mature library with excellent React integration via `useTranslation()` hook.
- **Namespace support**: Can split translations by feature if needed.
- **Interpolation**: Built-in support for `{{ variable }}` substitution.
- **Detection**: Language detection plugins available for browser locale.
- **TypeScript**: Good type support with `TFunction`.

## Pattern
- All user-facing strings use `t('key')` from `useTranslation()` hook.
- Data-layer constants use factory functions that accept `t: TFunction` parameter (e.g., `getMealTagOptions(t)`, `getTabLabels(t)`).
- Translation files stored in `src/locales/`.
- i18n instance configured in `src/i18n.ts`.

## Consequences
- No hardcoded user-facing strings in components.
- Factory functions (`get*()`) replace static constant objects to support dynamic language switching.
- Adding a new language requires only a new locale JSON file.
