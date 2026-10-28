# Shakh Delivery design system

The runtime theme is defined in `app/globals.css` using CSS custom properties and mapped to Tailwind semantic utilities in `tailwind.config.ts`.

## Customize the brand

Edit the `:root` values in `app/globals.css`. Prefer semantic tokens rather than adding new hard-coded brand colors to page components.

| Token | Purpose |
| --- | --- |
| `--color-primary` | Main brand/action color |
| `--color-primary-hover`, `--color-primary-active` | Interactive states |
| `--color-primary-foreground` | Text/icons on primary surfaces |
| `--color-secondary`, `--color-secondary-hover` | Quiet brand surfaces |
| `--color-accent` | Supporting highlight |
| `--color-background` | App page background |
| `--color-surface`, `--color-surface-elevated`, `--color-surface-muted` | Panels and controls |
| `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`, `--color-text-inverse` | Text hierarchy |
| `--color-border`, `--color-border-strong` | Dividers and control boundaries |
| `--color-success`, `--color-warning`, `--color-danger`, `--color-info` and corresponding foreground tokens | Status feedback |
| `--space-page`, `--content-width`, `--navigation-width` | Layout sizing |
| `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl` | Corner radius scale |
| `--shadow-card`, `--shadow-popover` | Elevation |
| `--focus-ring` | Keyboard focus indicator |
| `--motion-fast`, `--motion-normal`, `--ease-standard` | Motion tokens |

Tailwind utilities include `bg-primary`, `hover:bg-primary-hover`, `text-text-primary`, `bg-surface`, `border-border`, `bg-secondary`, and `shadow-card`.

## RTL and accessibility

The root document declares Sorani Kurdish (`lang="ckb"`) and right-to-left direction. Use logical CSS properties for new custom CSS. Keep keyboard focus visible, label form controls, provide status/error announcements, and respect `prefers-reduced-motion`.

## Data integrity

The landing page loads available products from Supabase and filters to approved stores. Empty and error states are intentional; do not replace them with fabricated products, prices, ratings, or operating statistics. Checkout remains explicitly unavailable until a secure server-side order and settlement workflow is implemented.
