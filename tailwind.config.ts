import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: "#FDF5E6",
        gold: "#D4AF37",
        crimson: "#800000",
        ink: "#2E2016",
      },
      boxShadow: {
        temple: "0 8px 24px rgba(46, 32, 22, 0.12)",
      },
      backgroundImage: {
        "thai-paper": "radial-gradient(circle at 20% 20%, rgba(212,175,55,0.16), transparent 36%), radial-gradient(circle at 80% 10%, rgba(128,0,0,0.12), transparent 28%), linear-gradient(160deg, #fdf5e6 0%, #f9ecd0 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
