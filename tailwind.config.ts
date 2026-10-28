import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "var(--color-primary)", hover: "var(--color-primary-hover)", active: "var(--color-primary-active)", foreground: "var(--color-primary-foreground)" },
        secondary: { DEFAULT: "var(--color-secondary)", hover: "var(--color-secondary-hover)" },
        accent: "var(--color-accent)",
        background: "var(--color-background)",
        surface: { DEFAULT: "var(--color-surface)", elevated: "var(--color-surface-elevated)", muted: "var(--color-surface-muted)" },
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-muted": "var(--color-text-muted)",
        "text-inverse": "var(--color-text-inverse)",
        border: { DEFAULT: "var(--color-border)", strong: "var(--color-border-strong)" },
        success: { DEFAULT: "var(--color-success)", foreground: "var(--color-success-foreground)" },
        warning: { DEFAULT: "var(--color-warning)", foreground: "var(--color-warning-foreground)" },
        danger: { DEFAULT: "var(--color-danger)", foreground: "var(--color-danger-foreground)" },
        info: { DEFAULT: "var(--color-info)", foreground: "var(--color-info-foreground)" },
      },
      maxWidth: { content: "var(--content-width)" },
      boxShadow: { card: "var(--shadow-card)", popover: "var(--shadow-popover)" },
      borderRadius: { control: "var(--radius-md)", panel: "var(--radius-lg)", card: "var(--radius-xl)" },
      transitionDuration: { fast: "var(--motion-fast)", normal: "var(--motion-normal)" },
    },
  },
  plugins: [],
};
export default config;
