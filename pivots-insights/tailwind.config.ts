import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0B0B0B",
        panel: "#111111",
        card: "#141414",
        line: "rgba(255,255,255,0.08)",
        ink: "#EDEDED",
        muted: "#8A8A8A",
        accent: "#5B8CFF",
      },
      borderRadius: {
        xl2: "18px",
      },
    },
  },
  plugins: [],
};

export default config;
