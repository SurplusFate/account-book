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
        // 语义化颜色：直接引用 CSS 变量，便于主题切换
        ink: {
          950: "var(--bg)",
          900: "var(--bg-elev)",
          800: "var(--bg-card-solid)",
          700: "var(--bg-card-solid)",
          600: "var(--bg-card-solid)",
        },
        amber: {
          DEFAULT: "var(--accent)",
          50: "var(--accent-soft)",
          100: "var(--accent-soft)",
          400: "var(--accent-hover)",
          500: "var(--accent)",
          600: "var(--accent)",
          700: "var(--accent)",
        },
        cream: {
          DEFAULT: "var(--text)",
          muted: "var(--text-muted)",
          dim: "var(--text-dim)",
        },
        danger: "var(--danger)",
        success: "var(--success)",
      },
      fontFamily: {
        serif: ['"Spectral"', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: "0 0 40px -10px color-mix(in srgb, var(--accent) 35%, transparent)",
        card: "0 8px 30px -12px rgba(0,0,0,0.6)",
        'card-hover': "0 14px 40px -12px rgba(0,0,0,0.7)",
      },
      backgroundImage: {
        'radial-glow':
          "radial-gradient(ellipse 80% 60% at 50% -10%, var(--accent-soft), transparent 70%)",
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
