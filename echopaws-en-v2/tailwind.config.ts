import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#faf7f2",
        warm: "#fffaf3",
        ink: "#1f2937",
        muted: "#6b7280",
        ambersoft: "#f59e0b",
        orangesoft: "#f97316",
      },
      boxShadow: {
        soft: "0 20px 60px rgba(31,41,55,0.10)",
      },
      borderRadius: {
        xl2: "28px",
      },
      backgroundImage: {
        "hero-wash": "radial-gradient(circle at 10% 10%, rgba(245,158,11,.10), transparent 30%), radial-gradient(circle at 90% 0, rgba(249,115,22,.08), transparent 28%), linear-gradient(180deg,#fffaf3 0%,#faf7f2 40%,#f8f4ee 100%)",
        "brand-gradient": "linear-gradient(135deg,#f59e0b,#f97316)",
        "bubble-gradient": "linear-gradient(180deg,#fff0df 0%,#ffe7cc 100%)",
        "card-gradient": "linear-gradient(180deg,rgba(255,255,255,.8),rgba(255,247,237,.86))",
      },
    },
  },
  plugins: [],
};

export default config;
