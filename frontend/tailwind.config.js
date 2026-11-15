/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Washi Paper (Backgrounds & Surfaces)
        washi: {
          50: "#FDFBF7",
          100: "#FAF8F5",
          200: "#F4EFEA",
          300: "#EAE3D9",
          400: "#D8CFC4",
        },
        // Sumi Ink (Text & Shadows)
        sumi: {
          900: "#1E2022",
          800: "#2D3134",
          700: "#3D4348",
          600: "#545C62",
          500: "#747E86",
          400: "#9BA5AE",
          200: "#D5DCE2",
          100: "#E9EEF2",
        },
        // Ai-iro (Japanese Indigo / Deep Prussian Blue)
        ai: {
          900: "#182B48",
          800: "#213C64",
          700: "#2B4C7E",
          600: "#38619E",
          500: "#4D78B8",
          300: "#89A8D4",
          100: "#EBF1F9",
          50: "#F4F7FB",
        },
        // Shu-iro (Vermilion / Cinnabar Red - Hanko Seal)
        shu: {
          800: "#96281C",
          700: "#BA3C2D",
          600: "#E04F3E",
          500: "#EB6757",
          400: "#F18D80",
          100: "#FDEEEB",
          50: "#FEF7F5",
        },
        // Matcha Green (Harmonious Success Accent)
        matcha: {
          800: "#375545",
          700: "#466C58",
          600: "#5B8A72",
          500: "#72A38A",
          400: "#8FBAA3",
          100: "#EEF5F1",
          50: "#F7FAF8",
        },
        // Yamabuki (Golden Amber / Bamboo Accent)
        yamabuki: {
          800: "#8C5C16",
          700: "#B07621",
          600: "#C98A2C",
          500: "#E5A138",
          100: "#FBF4E6",
          50: "#FDF9F2",
        },
      },
      fontFamily: {
        sans: [
          '"Hiragino Sans"',
          '"Hiragino Kaku Gothic ProN"',
          '"Noto Sans JP"',
          "Inter",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        serif: [
          '"Hiragino Mincho ProN"',
          '"Noto Serif JP"',
          '"Yu Mincho"',
          "serif",
        ],
      },
      keyframes: {
        blink: {
          "0%, 90%, 100%": { transform: "scaleY(1)" },
          "95%": { transform: "scaleY(0.08)" },
        },
        idleSway: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-3px) rotate(0.4deg)" },
        },
        hamonPulse: {
          "0%": { transform: "scale(0.95)", opacity: "0.8" },
          "100%": { transform: "scale(1.4)", opacity: "0" },
        },
      },
      animation: {
        blink: "blink 4s infinite ease-in-out",
        "idle-sway": "idleSway 5s infinite ease-in-out",
        "hamon-pulse": "hamonPulse 2s cubic-bezier(0, 0.2, 0.8, 1) infinite",
      },
    },
  },
  plugins: [],
};

