/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      colors: {
        bg: {
          DEFAULT: "#0b0e14",
          subtle: "#11151f",
          panel: "#151a24",
          hover: "#1c2230",
        },
        border: {
          DEFAULT: "#232a38",
          strong: "#2f3848",
        },
        fg: {
          DEFAULT: "#e6e9ef",
          muted: "#9aa4b8",
          subtle: "#6b7488",
        },
        accent: {
          DEFAULT: "#5b9bff",
          hover: "#74acff",
        },
        level: {
          error: "#ff6b6b",
          warn: "#f7b955",
          info: "#5b9bff",
          debug: "#9aa4b8",
        },
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(2px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 120ms ease-out",
      },
    },
  },
  plugins: [],
};
