/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f2f1',
          100: '#cce5e3',
          200: '#99cbc7',
          300: '#66b1ab',
          400: '#33978f',
          500: '#006a5e',
          600: '#00574c',
          700: '#004439',
          800: '#003127',
          900: '#001f18',
        },
      },
    },
  },
  plugins: [],
}
