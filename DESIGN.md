# DESIGN.md

This extension uses the same token contract as the workspace-level `DESIGN.md`.

## Atmosphere / Signature

Personal audit console with Mercury-inspired precision. Dense information, clear failure states, no decorative chrome, cool near-white surfaces, hairline borders, and one indigo technical accent.

## Color

- `#FFFFFF` `--color-bg`
- `#FBFBFC` `--color-surface`
- `#1A1A2E` `--color-text`
- `#6B7280` `--color-muted`
- `#E5E7EB` `--color-border`
- `#D1D5DB` `--color-border-strong`
- `#5266EB` `--color-primary`
- `#4254D4` `--color-primary-hover`
- `#FFFFFF` `--color-on-primary`
- `#16A34A` `--color-accent`
- `#E11D48` `--color-danger`
- `#B45309` `--color-warning`
- `#EEF0FF` `--color-primary-soft`
- `#F7F7F8` `--color-muted-surface`
- `rgba(82,102,235,0.25)` `--color-ring`

## Typography

`"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`, without importing web fonts. Title 18px/600/1.25, section 13px/600/1.3, body 13px/400/1.45, small 12px/400/1.35, mono 12px/500/1.35. Letter spacing is `0`.

## Spacing

Base unit 4px. Tokens: `--space-1` 4px, `--space-2` 8px, `--space-3` 12px, `--space-4` 16px, `--space-5` 20px, `--space-6` 24px, `--space-8` 32px.

## Components

Buttons and inputs use 8px radius, compact badges and setting tooltips use 6px radius, result rows and diagnostics use token borders, and focus uses `--color-ring`. Sections use separators, not nested cards.

## Motion

120ms hover/focus, 180ms panel transitions, transform and opacity only. Reduced motion disables transform transitions.

## Depth

Borders and tonal surfaces only. No drop shadows.
