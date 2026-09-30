/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        display: [
          "Poppins",
          "Inter",
          "-apple-system",
          "sans-serif",
        ],
      },
      colors: {
        brand: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          950: "#2e1065",
        },
        coral: {
          400: "#ff8a80",
          500: "#ff6f61",
          600: "#f4511e",
        },
        sunny: {
          300: "#ffe082",
          400: "#ffd54f",
          500: "#ffc107",
        },
        mint: {
          300: "#94ead0",
          400: "#5fd8ab",
          500: "#2dbe8e",
        },
        sky: {
          300: "#a9ddff",
          400: "#7cc4ff",
          500: "#4fa8f0",
        },
        blush: {
          300: "#ffc2e2",
          400: "#ff9fd0",
          500: "#f472b6",
        },
        // Sampled from public/assets/branding/moodmeal-logo.png (the leaf)
        // so accent greens (selection rings, CTA buttons, active nav state)
        // match the official brand mark rather than a generic green.
        moodGreen: {
          50: "#f2fbec",
          100: "#e2f7d4",
          300: "#aee585",
          400: "#7fd858",
          500: "#5cb83a",
          600: "#48962c",
          700: "#397825",
        },
        // Sampled from the logo's pink/purple/violet gradient.
        moodPink: {
          400: "#e17fe0",
          500: "#d559d9",
          600: "#bb3fcf",
        },
        moodViolet: {
          400: "#a430da",
          500: "#8123e0",
          600: "#6c1bbd",
        },
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        soft: "0 8px 24px -8px rgba(124, 58, 237, 0.25)",
        card: "0 4px 16px -4px rgba(30, 20, 60, 0.12)",
        "card-hover": "0 12px 28px -8px rgba(124, 58, 237, 0.28)",
        nav: "0 -4px 20px -4px rgba(30, 20, 60, 0.10)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "bounce-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "wiggle": {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        "float-in": {
          "0%": { opacity: "0", transform: "translateY(14px) scale(0.96)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "sheet-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scan-sweep": {
          "0%, 100%": { transform: "rotate(-8deg) scale(1)" },
          "50%": { transform: "rotate(8deg) scale(1.08)" },
        },
        "dot-pulse": {
          "0%, 80%, 100%": { opacity: "0.25", transform: "scale(0.85)" },
          "40%": { opacity: "1", transform: "scale(1)" },
        },
        // A brief, infrequent vertical squash on an avatar's open-eye
        // shapes — reads as a blink without being a distracting continuous
        // animation. Both eyes share this keyframe and mount together, so
        // they blink in sync like a real pair of eyes would.
        "mm-blink": {
          "0%, 92%, 100%": { transform: "scaleY(1)" },
          "96%": { transform: "scaleY(0.12)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.35s ease-out both",
        "pop-in": "pop-in 0.25s cubic-bezier(0.34,1.56,0.64,1) both",
        "bounce-slow": "bounce-slow 3s ease-in-out infinite",
        "wiggle": "wiggle 2.5s ease-in-out infinite",
        "float-in": "float-in 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "sheet-up": "sheet-up 0.3s cubic-bezier(0.16,1,0.3,1) both",
        "scan-sweep": "scan-sweep 1.6s ease-in-out infinite",
        "dot-pulse": "dot-pulse 1.2s ease-in-out infinite",
        "mm-blink": "mm-blink 4.5s ease-in-out infinite",
      },
      maxWidth: {
        app: "480px",
      },
    },
  },
  plugins: [],
};
