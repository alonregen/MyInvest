/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./assets/app.js"],
  // Preflight is disabled so the existing hand-written design (folded into the
  // components layer) renders identically; utilities remain available on top.
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#102537", soft: "#5a6e7c", muted: "#7c8d98" },
        navy: { DEFAULT: "#17324d", strong: "#0f2537" },
        teal: { DEFAULT: "#1c8f86", soft: "#d8f2f1" },
        gold: { DEFAULT: "#d1a25b", soft: "#f2e5c8" },
        rose: { soft: "#f5ddd4" },
      },
      borderRadius: {
        xl: "30px",
        lg: "22px",
        md: "16px",
        sm: "12px",
      },
      boxShadow: {
        lg: "0 26px 65px rgba(16, 37, 55, 0.12)",
        md: "0 14px 32px rgba(16, 37, 55, 0.08)",
      },
      fontFamily: {
        display: ['"Avenir Next Condensed"', '"Gill Sans"', '"Noto Sans Hebrew"', '"Segoe UI"', "sans-serif"],
        body: ['"Avenir Next"', '"Noto Sans Hebrew"', '"Segoe UI"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
