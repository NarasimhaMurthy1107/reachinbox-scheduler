/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#090A0F',
        darkCard: '#11131A',
        darkSurface: '#161923',
        darkBorder: '#222736',
        primaryIndigo: '#5850EC',
        primaryHover: '#4B43DB',
        accentViolet: '#7C3AED',
      },
    },
  },
  plugins: [],
}
