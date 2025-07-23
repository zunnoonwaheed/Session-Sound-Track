/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tripsonic: {
          light: '#f9f8f4',
          warm: '#fffef4',
          blend: '#fbf9f4' // a mix between both
        }
      },
       fontFamily: {
        minion: ['"Crimson Pro"', 'serif'],
        europa: ['Barlow', 'sans-serif'],
      },
    },
  },
  plugins: [],
}