import type { Config } from "tailwindcss";
const config: Config = { content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"], theme: { extend: { colors: { shakh: { green: "#1d6b38", dark: "#143d25" } } } }, plugins: [] };
export default config;
