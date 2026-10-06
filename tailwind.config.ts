import type { Config } from "tailwindcss";

const config: Config = {
  // PERBAIKAN: Menghapus tanda kurung siku pada nilai "class"
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      colors: {
        shopee: {
          50: "#fff5f2",
          100: "#ffe8e2",
          200: "#ffd5ca",
          300: "#ffb5a3",
          400: "#ff8266",
          500: "#ee4d2d", // Shopee Orange standard
          600: "#d73211",
          700: "#b52408",
          800: "#92200b",
          900: "#791f0e",
        },
        navy: {
          800: "#0f172a",
          900: "#0b0f19",
          950: "#06080e",
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
export default config;