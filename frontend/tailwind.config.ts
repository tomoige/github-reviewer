import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // styles.md v4 — "Vintage Atlas": warm sand neutrals, deep teal accent
        base: "#EBE7DD", // warm sand background
        card: "#F6F3EC", // card surfaces (light sand)
        cardAlt: "#E2DCCD", // inset / tinted cards, inputs
        line: "#CEC8B6", // subtle warm dividers
        primary: "#136F63", // deep teal — primary CTAs / score ring / highlights (not "accent" — reserved in Tailwind)
        positive: "#4A7A2C", // olive green — strengths / positive metrics
        negative: "#9A3324", // oxblood — critical weaknesses / summary border
        ink: "#1C1410", // primary text (warm near-black)
        muted: "#6B5E52", // secondary text
        cream: "#F7F4EC", // text on colored backgrounds
        summaryBg: "#14211F", // dark petrol summary card
        summaryText: "#D9E0D5", // pale sage text on summary card
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
        // Alias so any stray font-serif renders as the sans face (no serif in v3).
        serif: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        warm: "0 4px 24px rgba(100, 60, 20, 0.12)",
        "warm-lg": "0 10px 40px rgba(100, 60, 20, 0.16)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease both",
      },
    },
  },
  plugins: [],
};

export default config;
