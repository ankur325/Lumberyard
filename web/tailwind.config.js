/** @type {import('tailwindcss').Config} */

// Colors are driven by CSS variables (RGB channel triplets) defined in
// src/index.css, so the same Tailwind tokens resolve to the dark or light
// palette depending on the `.light` class on <html>. The `<alpha-value>`
// placeholder keeps opacity utilities (e.g. bg-level-error/10) working.
const v = (name) => `rgb(var(${name}) / <alpha-value>)`;

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
          DEFAULT: v("--bg"),
          subtle: v("--bg-subtle"),
          panel: v("--bg-panel"),
          hover: v("--bg-hover"),
        },
        border: {
          DEFAULT: v("--border"),
          strong: v("--border-strong"),
        },
        fg: {
          DEFAULT: v("--fg"),
          muted: v("--fg-muted"),
          subtle: v("--fg-subtle"),
        },
        accent: {
          DEFAULT: v("--accent"),
          hover: v("--accent-hover"),
        },
        level: {
          error: v("--level-error"),
          warn: v("--level-warn"),
          info: v("--level-info"),
          debug: v("--level-debug"),
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
