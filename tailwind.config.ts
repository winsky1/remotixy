import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#F8FBFF",
        panel: "#FFFFFF",
        panelSoft: "#F1F5F9",
        assist: "#007AFF",
        assistBlue: "#17A2B8",
        warning: "#F8C14A",
        danger: "#FF4D6D"
      },
      boxShadow: {
        glow: "0 18px 45px rgba(0, 122, 255, 0.22)",
        card: "0 24px 80px rgba(15, 23, 42, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
