import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        muted: "var(--muted)",
        line: "var(--line)",
        "line-strong": "var(--line-strong)",
        primary: {
          DEFAULT: "var(--primary)",
          strong: "var(--primary-strong)",
          soft: "var(--primary-soft)"
        },
        energy: {
          DEFAULT: "var(--energy)",
          soft: "var(--energy-soft)"
        },
        progress: {
          DEFAULT: "var(--progress)",
          soft: "var(--progress-soft)"
        },
        warn: {
          DEFAULT: "var(--warn)",
          soft: "var(--warn-soft)"
        },
        physics: { DEFAULT: "var(--physics)", soft: "var(--physics-soft)" },
        chem: { DEFAULT: "var(--chem)", soft: "var(--chem-soft)" },
        math: { DEFAULT: "var(--math)", soft: "var(--math-soft)" },
        bio: { DEFAULT: "var(--bio)", soft: "var(--bio-soft)" }
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      borderRadius: {
        xl2: "20px",
        "3xl": "24px"
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,17,21,0.04), 0 8px 24px rgba(15,17,21,0.05)",
        hover: "0 1px 2px rgba(15,17,21,0.06), 0 16px 40px rgba(15,17,21,0.08)",
        ring: "0 0 0 4px rgba(99,102,241,0.14)",
        amber: "0 0 0 4px rgba(245,158,11,0.18)"
      }
    }
  },
  plugins: []
};

export default config;
