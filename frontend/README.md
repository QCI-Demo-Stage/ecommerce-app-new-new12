# Ecommerce App New — Frontend UI Library

Shared React + TypeScript component library and responsive base layout for the ecommerce SPA.

## What’s included

| Area | Details |
|------|---------|
| **Design tokens** | Colors, spacing, typography, radii, grid columns/gutters, safe-area insets (`src/tokens`) |
| **Breakpoints** | Mobile-first: mobile `0`, tablet `768px`, desktop `1024px` |
| **Layout** | `Layout` shell with flex column + CSS grid content, safe-area padding |
| **Components** | `Button`, `Input`, `Card`, `Navigation` — typed props, ARIA attributes, token-based CSS modules |
| **Tests** | Jest + React Testing Library (render + a11y assertions) |
| **Storybook** | Usage docs + Chromatic viewport stories for mobile / tablet / desktop visual regression |

## Quick start

```bash
cd frontend
npm install
npm run dev
```

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run test` | Unit tests (Jest + RTL) |
| `npm run storybook` | Component docs & breakpoint previews |
| `npm run build-storybook` | Static Storybook build (visual regression input) |
| `npm run typecheck` | TypeScript project references check |
| `npm run build` | Production Vite build |

## Library usage

```tsx
import {
  Button,
  Card,
  Input,
  Layout,
  Navigation,
  breakpoints,
} from '@ecommerce/ui';
import '@ecommerce/ui/styles';

export function Page() {
  return (
    <Layout
      header={<Navigation brand="Ecommerce App New" items={[{ id: 'home', label: 'Home', href: '/', current: true }]} />}
    >
      <Card title="Hello">
        <Input label="Search" />
        <Button>Go</Button>
      </Card>
    </Layout>
  );
}
```

## Breakpoints & safe areas

- Tokens live in `src/tokens/breakpoints.ts` and `src/tokens/tokens.css`.
- `Layout` applies `env(safe-area-inset-*)` so notched devices keep content clear of system UI.
- Storybook stories under `Layout/BaseLayout` (`MobileBreakpoint`, `TabletBreakpoint`, `DesktopBreakpoint`) are tagged for Chromatic viewports `375`, `768`, and `1280`.

## Story ID

Implements story **Create reusable UI component library and base layout** (`d0da3e7b-35ae-4365-8ba5-3a2b05e44a74`).
