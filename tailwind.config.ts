import type { Config } from 'tailwindcss';

/**
 * Colours resolve to the CSS custom properties defined in src/styles/tokens.css, so a
 * utility like `bg-surface` or `text-ink` follows the active theme automatically. The
 * hex values live in exactly one place — the token file — and are never repeated here.
 *
 * Caveat: because the tokens are plain hex rather than channel triplets, Tailwind's
 * slash-opacity modifiers (`bg-accent/50`) will not work on these colours. Use a
 * dedicated token or an explicit rgba() instead.
 *
 * The system is deliberately narrow: one accent green, one clay for destructive
 * actions, and a neutral ramp. Depth comes from hairline borders, never shadow.
 */
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // Matches the attribute ThemeScript sets on <html> before first paint.
  darkMode: ['variant', '&:where([data-theme="dark"] *)'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          pressed: 'var(--accent-pressed)',
          tint: 'var(--accent-tint)',
          'tint-hover': 'var(--accent-tint-hover)',
          ring: 'var(--accent-ring)',
          on: 'var(--accent-on)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          hover: 'var(--danger-hover)',
          pressed: 'var(--danger-pressed)',
          tint: 'var(--danger-tint)',
          border: 'var(--danger-border)',
          ring: 'var(--danger-ring)',
          on: 'var(--danger-on)',
        },
        warn: {
          DEFAULT: 'var(--warn)',
          tint: 'var(--warn-tint)',
          border: 'var(--warn-border)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          secondary: 'var(--ink-secondary)',
          muted: 'var(--ink-muted)',
          disabled: 'var(--ink-disabled)',
        },
        line: {
          DEFAULT: 'var(--line)',
          strong: 'var(--line-strong)',
          subtle: 'var(--line-subtle)',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          sunken: 'var(--surface-sunken)',
          muted: 'var(--surface-muted)',
        },
        sidebar: {
          DEFAULT: 'var(--sidebar-bg)',
          surface: 'var(--sidebar-surface)',
          ink: 'var(--sidebar-ink)',
        },
        /** Product marks. Reserved for data — never for an interactive element. */
        product: {
          gasoline: 'var(--product-gasoline)',
          diesel: 'var(--product-diesel)',
          'ev-ac': 'var(--product-ev-ac)',
          'ev-dc-fast': 'var(--product-ev-dc-fast)',
          'ev-dc-ultra': 'var(--product-ev-dc-ultra)',
        },
        /** Categorical series for non-product charts, in application order. */
        chart: {
          1: 'var(--chart-1)',
          2: 'var(--chart-2)',
          3: 'var(--chart-3)',
          4: 'var(--chart-4)',
          5: 'var(--chart-5)',
          6: 'var(--chart-6)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        control: 'var(--radius-control)',
        card: 'var(--radius-card)',
      },
      boxShadow: {
        /**
         * Focus rings only — the system adds no depth. Two-tone: the solid edge
         * carries the contrast, the halo keeps it quiet.
         */
        'ring-accent': 'var(--focus-ring)',
        'ring-danger': 'var(--focus-ring-danger)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'dot-pattern': 'radial-gradient(circle, var(--line-subtle) 1px, transparent 1px)',
      },
      backgroundSize: {
        dots: '20px 20px',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
};

export default config;
