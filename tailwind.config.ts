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
          sidebar: '#1E293B',
          'sidebar-hover': '#334155',
          'sidebar-active': '#475569',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
};

export default config;
