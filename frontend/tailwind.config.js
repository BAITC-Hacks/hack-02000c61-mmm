/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#102a26',
        forest: '#0d5c4a',
        mint: '#dff3ea',
        gold: '#d2a947',
        canvas: '#f5f7f3',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 14px 45px rgba(16, 42, 38, 0.08)',
      },
    },
  },
  plugins: [],
}

