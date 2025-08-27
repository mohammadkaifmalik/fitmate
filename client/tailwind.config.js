/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7ff",
          100: "#d9ecff",
          200: "#b9dbff",
          300: "#8ac3ff",
          400: "#5aa9ff",
          500: "#2b8cff",
          600: "#156fe6",
          700: "#0f57b4",
          800: "#0d478f",
          900: "#0c3d78"
        }
      }
    },
  },
  plugins: [],
}
