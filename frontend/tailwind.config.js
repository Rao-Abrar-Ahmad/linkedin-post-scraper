/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        linkedin: {
          blue: '#0a66c2',
          hover: '#004182',
          light: '#f3f6f8',
          dark: '#1d2226'
        }
      }
    },
  },
  plugins: [],
}
