import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cyber dark palette
        cyber: {
          bg: "#050a14",
          surface: "#0a1628",
          card: "#0d1f3c",
          border: "#1a3a5c",
          accent: "#00d4ff",
          "accent-dim": "#0099bb",
          green: "#00ff88",
          "green-dim": "#00cc6a",
          red: "#ff3366",
          "red-dim": "#cc2952",
          yellow: "#ffcc00",
          purple: "#9945ff",
          "purple-dim": "#7733cc",
          text: "#e2e8f0",
          muted: "#64748b",
          "muted-light": "#94a3b8",
        },
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "'Fira Code'", "monospace"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "cyber-grid":
          "linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)",
        "glass-gradient":
          "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
        "accent-gradient":
          "linear-gradient(135deg, #00d4ff 0%, #9945ff 100%)",
        "danger-gradient":
          "linear-gradient(135deg, #ff3366 0%, #ff6b35 100%)",
        "safe-gradient":
          "linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)",
      },
      backgroundSize: {
        grid: "40px 40px",
      },
      boxShadow: {
        "cyber-sm": "0 0 10px rgba(0,212,255,0.15)",
        cyber: "0 0 20px rgba(0,212,255,0.2)",
        "cyber-lg": "0 0 40px rgba(0,212,255,0.25)",
        "cyber-glow": "0 0 60px rgba(0,212,255,0.3), 0 0 120px rgba(0,212,255,0.1)",
        "danger-glow": "0 0 20px rgba(255,51,102,0.3)",
        "safe-glow": "0 0 20px rgba(0,255,136,0.3)",
        glass: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scan-line": "scanLine 2s linear infinite",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        scanLine: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
