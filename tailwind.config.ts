import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        fuel: {
          orange: '#F97316',
          'orange-light': '#FED7AA',
          'orange-dark': '#EA580C',
          blue: '#3B82F6',
          'blue-light': '#BFDBFE',
          'blue-dark': '#2563EB',
          sidebar: '#0F172A',
          'sidebar-hover': '#1E293B',
          'sidebar-active': '#334155',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        'glow-orange': '0 4px 14px rgba(249, 115, 22, 0.3)',
        'glow-blue': '0 4px 14px rgba(59, 130, 246, 0.3)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'dot-pattern': 'radial-gradient(circle, #E2E8F0 1px, transparent 1px)',
      },
      backgroundSize: {
        'dots': '20px 20px',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
};

export default config;
