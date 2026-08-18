# Ecommerce UI Component Library

Shared React + TypeScript component library and responsive base layout for **Ecommerce App New**.

## What's included

| Area | Details |
|------|---------|
| Design tokens | Colors, spacing, typography, breakpoints (`src/tokens`) |
| Layout | Mobile-first `Layout` with safe-area insets + responsive grid |
| Components | `Button`, `Input`, `Card`, `Navigation` |
| Tests | Jest + React Testing Library |
| Docs | Storybook stories + Chromatic viewport snapshots for breakpoints |

## Breakpoints (mobile-first)

| Name | Range |
|------|-------|
| Mobile | 0–767px (base) |
| Tablet | ≥768px |
| Desktop | ≥1024px |

Grid columns: **4 / 8 / 12** (mobile / tablet / desktop).

## Quick start

```bash
cd frontend
npm install
npm run dev          # Vite demo app
npm test             # Unit tests
npm run storybook    # Component docs + visual viewports
```

## Package exports

```ts
import {
  Button,
  Input,
  Card,
  Navigation,
  Layout,
  BREAKPOINTS,
  colors,
  spacing,
  typography,
} from '@ecommerce/ui';
```

Import token CSS once at the app root:

```ts
import '@ecommerce/ui/tokens.css';
import '@ecommerce/ui/styles.css';
```

## Storybook visual regression

Layout stories under **Layout/BaseLayout** define `MobileBreakpoint`, `TabletBreakpoint`, and `DesktopBreakpoint` with Chromatic `viewports` matching design-token breakpoints. Run Storybook and switch the viewport addon, or use Chromatic / `@storybook/test-runner` in CI.

## Accessibility

Components include ARIA attributes (`aria-busy`, `aria-invalid`, `aria-current`, `aria-expanded`, landmarks) and visible focus styles via design tokens.
