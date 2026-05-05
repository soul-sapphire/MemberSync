/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {

      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },

      colors: {

        brand: {
          50: "#f5f7ff",
          100: "#ebf0fe",
          200: "#dee5fd",
          300: "#c3d0fb",
          400: "#9baef7",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },

        surface: {
          50: "#fafafa",
          100: "#f4f4f5",
          200: "#e4e4e7",
          300: "#d4d4d8",
          400: "#a1a1aa",
          500: "#71717a",
          600: "#52525b",
          700: "#3f3f46",
          800: "#27272a",
          900: "#18181b",
        },

      },

      boxShadow: {

        premium:
          "0 10px 30px -5px rgba(0,0,0,0.04), 0 4px 10px -5px rgba(0,0,0,0.02)",

        "premium-hover":
          "0 20px 40px -10px rgba(0,0,0,0.08), 0 8px 20px -10px rgba(0,0,0,0.04)",

      },

      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },

      transitionTimingFunction: {
        premium: "cubic-bezier(0.4, 0, 0.2, 1)",
      },

    },
  },

  plugins: [],
}