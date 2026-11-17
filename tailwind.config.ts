import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        stage: {
          bg: "#1B1F1D",
          surface: "#242927",
          surfaceRaised: "#2C3230",
          border: "#3A413E",
          paper: "#F1EDE4",
          paperMuted: "#B9B4A8",
          brass: "#C9A227",
          sage: "#6B7A70",
          clay: "#B4533C",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        script: ["var(--font-plex-mono)", "monospace"],
        ui: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
