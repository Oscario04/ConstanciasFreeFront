/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EFF4FB',
          100: '#D6E3F4',
          200: '#ADC7E8',
          300: '#7FA7D7',
          400: '#4D84C0',
          500: '#2A63A5',
          600: '#1E3A5F',
          700: '#172D4A',
          800: '#102035',
          900: '#091320',
        },
        accent: {
          300: '#E8D07A',
          400: '#DEC05A',
          500: '#C9A84C',
          600: '#A8892C',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}