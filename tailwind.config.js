/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0F172A",
        surface: "#1E293B",
        primary: {
          DEFAULT: "#6366F1",
          hover: "#4f46e5"
        },
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#F43F5E",
        textPrimary: "#F8FAFC",
        textSecondary: "#94A3B8",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      backgroundImage: {
        'indigo-gradient': 'linear-gradient(to right, #6366F1, #7C3AED)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'rose-glow': '0 0 15px rgba(244, 63, 94, 0.4)',
        'indigo-glow': '0 0 15px rgba(99, 102, 241, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 300ms ease-out forwards',
        'progress-load': 'progressLoad 600ms ease-out forwards',
        'pulse-dots': 'pulseDots 1.4s infinite ease-in-out',
        'glow-pulse': 'glowPulse 2s infinite ease-in-out',
        'shake': 'shake 400ms ease-in-out',
        'scroll-log': 'scrollLog 30s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        progressLoad: {
          '0%': { width: '0%' },
        },
        pulseDots: {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(244, 63, 94, 0.2)', borderColor: 'rgba(244, 63, 94, 0.2)' },
          '50%': { boxShadow: '0 0 15px rgba(244, 63, 94, 0.6)', borderColor: 'rgba(244, 63, 94, 0.8)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-6px)' },
          '40%, 80%': { transform: 'translateX(6px)' },
        },
        scrollLog: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-50%)' },
        }
      }
    },
  },
  plugins: [],
}
