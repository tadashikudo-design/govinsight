import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          blue: "#003087",
          "light-blue": "#0050b3",
          gray: "#f5f5f5",
        },
      },
    },
  },
  plugins: [],
};

export default config;
