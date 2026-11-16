export default {
  content: ["./pages/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f4f6fb",
          100: "#e8ecf5",
          200: "#cfd7ea",
          300: "#a9b7d6",
          400: "#7a8fbd",
          500: "#566ea3",
          600: "#3f5588",
          700: "#31446e",
          800: "#233155",
          900: "#172240",
          950: "#0e1630"
        }
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI Variable", "Segoe UI", "ui-sans-serif", "system-ui", "-apple-system", "Roboto", "Helvetica Neue", "Arial", "sans-serif"]
      },
      boxShadow: {
        card: "0 1px 2px rgba(23, 34, 64, 0.04), 0 4px 16px rgba(23, 34, 64, 0.05)"
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        fadeUp: "fadeUp 0.35s ease-out both"
      }
    }
  },
  plugins: []
}
