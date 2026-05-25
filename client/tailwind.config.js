/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
  theme: {
    extend: {
      colors: {
        cream: "#FFFFF0",
        charcoal: "#2D2D2D",
        "red-accent": "#8B1A1A",
      },
      fontFamily: {
        mont: ['"Mont"', '"Montserrat"', "sans-serif"],
        advokat: ['"Advokat Modern"', "sans-serif"],
        kalissa: ['"Kalissa"', '"Dancing Script"', "cursive"],
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-left": {
          from: { opacity: "0", transform: "translateX(-12px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        "slide-right": {
          from: { transform: "translateX(100%)" },
          to:   { transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in":    "fade-in 0.3s ease both",
        "slide-up":   "slide-up 0.35s ease both",
        "slide-left": "slide-left 0.3s ease both",
        "scale-in":   "scale-in 0.25s cubic-bezier(.16,1,.3,1) both",
        "slide-right":"slide-right 0.32s cubic-bezier(.16,1,.3,1) both",
      },
    },
  },
  plugins: [],
};
