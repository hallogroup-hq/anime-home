import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#090A0F",
          900: "#10121A",
          800: "#181B26",
          700: "#222736",
        },
        surface: {
          900: "#12151F",
          800: "#1A1E2C",
          700: "#242A3D",
          600: "#323A52",
        },
        border: {
          900: "#161924",
          800: "#1E2333",
          700: "#2B3245",
          600: "#3D4660",
        },
        brand: {
          DEFAULT: "#FF3B5C",
          hover: "#E62E4E",
          subtle: "rgba(255, 59, 92, 0.12)",
          glow: "rgba(255, 59, 92, 0.25)",
        },
        status: {
          available: "#10B981",
          subIndo: "#06B6D4",
          unverified: "#F59E0B",
          delayed: "#EF4444",
          restricted: "#8B5CF6",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      aspectRatio: {
        poster: "2 / 3",
        video: "16 / 9",
      },
    },
  },
  plugins: [],
};

export default config;
