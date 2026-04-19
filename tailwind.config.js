/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          sidebar: '#0f172a', // slate-900
          primary: '#2563eb', // blue-600
        },
      },
      transitionProperty: {
        drawer: 'transform',
      },
    },
  },
  plugins: [],
};
