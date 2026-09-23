/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#f4f7f6',
        forest: '#15a77b',
        mint: '#b8f5dd',
        gold: '#e3c26f',
        canvas: '#070b12',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 20px 60px rgba(0, 0, 0, 0.28)',
        glow: '0 0 45px rgba(45, 212, 161, 0.12)',
      },
    },
  },
  plugins: [],
}

