import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        shell: "#111827",
        canvas: "#efe9dc",
        ink: "#0f172a",
        line: "#d5d0c5",
        accent: "#0f766e",
        accentSoft: "#d6f2ee",
        ember: "#f59e0b",
        emberSoft: "#fff2d8"
      },
      boxShadow: {
        card: "0 14px 40px rgba(15, 23, 42, 0.08)"
      },
      borderRadius: {
        panel: "2rem"
      }
    },
  },
  plugins: [],
};

export default config;
