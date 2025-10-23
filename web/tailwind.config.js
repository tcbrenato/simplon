/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#195885',
        gold: '#D4AF37',
        white: '#FFFFFF',
      }
    },
  },
  plugins: [],
}
