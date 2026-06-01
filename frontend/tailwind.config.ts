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
        cardAlt: "#D9D2C4", // inset / tinted cards — slightly darker for separation
        line: "#A39684", // warm dividers — visible on card surfaces
        lineStrong: "#8A8170", // emphasis borders
        primary: "#136F63", // deep teal — primary CTAs / score ring / highlights
        primaryDark: "#0E564E", // teal for small text / links (better contrast)
        positive: "#3D6824", // olive green — strengths (darkened for contrast)
        negative: "#8A2D20", // oxblood — weaknesses (darkened for contrast)
        ink: "#1C1410", // primary text (warm near-black)
        muted: "#4A4038", // secondary text — AA on sand/card backgrounds
        cream: "#F7F4EC", // text on colored backgrounds
        summaryBg: "#14211F", // dark petrol summary card
        summaryText: "#E8EDE4", // text on the summary card (brightened)
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
