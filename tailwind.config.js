import daisyui from 'daisyui'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./inertia/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    themes: ['dim'],
  },
}
