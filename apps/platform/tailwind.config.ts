import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      colors: {
        dark: {
          DEFAULT: '#0a0a0a',
          50: '#141414',
          100: '#1a1a1a',
          200: '#222222',
          300: '#2a2a2a',
        },
        accent: {
          DEFAULT: '#c9a96e',
          light: '#dfc9a0',
          dark: '#a8884e',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
export default config
