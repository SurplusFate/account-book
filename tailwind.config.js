/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      spacing: {
        '4.5': '1.125rem',
      },
      colors: {
        // 深墨绿/炭黑底
        ink: {
          950: "#0B0F0E",
          900: "#0E1A17",
          800: "#13231F",
          700: "#1A2E29",
          600: "#243933",
        },
        // 琥珀金强调色
        amber: {
          DEFAULT: "#E8B14A",
          50: "#FDF6E6",
          100: "#FAE9C2",
          400: "#EFC56A",
          500: "#E8B14A",
          600: "#D49A2E",
          700: "#A8761F",
        },
        // 柔和米白文字
        cream: {
          DEFAULT: "#F2EBDC",
          muted: "#C9C3B4",
          dim: "#8A958F",
        },
        danger: "#E06464",
        success: "#5BC18F",
      },
      fontFamily: {
        serif: ['"Spectral"', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(232,177,74,0.35)",
        card: "0 8px 30px -12px rgba(0,0,0,0.6)",
        'card-hover': "0 14px 40px -12px rgba(0,0,0,0.7)",
      },
      backgroundImage: {
        'radial-glow':
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(232,177,74,0.12), transparent 70%)",
        'noise':
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 0.9 0 0 0 0 0.85 0 0 0 0 0.7 0 0 0 0.04 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-in': "fadeIn 0.4s ease forwards",
        'rise': "rise 0.5s cubic-bezier(0.16,1,0.3,1) forwards",
        'pulse-soft': "pulseSoft 2.4s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%,100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
