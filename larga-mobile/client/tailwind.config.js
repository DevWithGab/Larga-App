/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#f57c1f',
          light: '#ff9f4a',
          dark: '#d66a15',
        },
      },
      fontFamily: {
        // Baloo 2 — rounded, friendly display font matching the app design.
        // Each weight is its own font file, so pick the matching class
        // explicitly instead of font-bold/font-semibold/font-medium.
        regular: ['Baloo2_400Regular'],
        label: ['Baloo2_500Medium'],
        accent: ['Baloo2_600SemiBold'],
        heading: ['Baloo2_700Bold'],
        display: ['Baloo2_800ExtraBold'],
      },
    },
  },
  plugins: [],
}

