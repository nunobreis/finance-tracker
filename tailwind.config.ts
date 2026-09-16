import type { Config } from 'tailwindcss'

// NOTE: Tailwind v4 uses CSS-based @theme in globals.css for design tokens.
// This file retains the content paths and mirrors the token list for
// tooling/IDE support. The authoritative token definitions live in
// app/globals.css under the @theme block.
const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'sidebar-bg':    '#0D1525',
        'content-bg':    '#F0F4F8',
        'card-bg':       '#FFFFFF',
        'accent':        '#0EB5D4',
        'accent-light':  '#E0F7FC',
        'text-primary':  '#0F172A',
        'text-secondary':'#64748B',
        'text-tertiary': '#94A3B8',
        'border-col':    '#E2E8F0',
        'nav-icon-col':  '#4A6890',
        'nav-active-bg': '#162236',
        'status-good':   '#22C55E',
        'status-warn':   '#F59E0B',
        'status-danger': '#EF4444',
        'good-bg':       '#DCFCE7',
        'warn-bg':       '#FEF3C7',
        'danger-bg':     '#FEE2E2',
        'warn-icon-bg':  '#FEF3C7',
        'good-icon-bg':  '#DCFCE7',
      },
    },
  },
  plugins: [],
}

export default config
