/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        burgundy: {
          50:  '#fdf2f5',
          100: '#fce7ec',
          200: '#f9d0da',
          300: '#f4a9bc',
          400: '#ed7796',
          500: '#e14a72',
          600: '#cc2a54',
          700: '#9b2e4e',
          800: '#7b1e3a',
          900: '#5c1429',
          950: '#3d0a1c',
          DEFAULT: '#7b1e3a',
        },
        gold: {
          light: '#e8b855',
          DEFAULT: '#c9973a',
          dark: '#a87a28',
        },
        gray: {
          50: '#f9f7f7',
          100: '#f3efef',
          200: '#e8e2e2',
          300: '#d4cbcb',
          400: '#9e8e8e',
          500: '#7a6a6a',
          600: '#5c4f4f',
          700: '#3f3535',
          800: '#2d1f1f',
          900: '#1a1010',
        },
      },
      fontFamily: {
        cairo: ['var(--font-cairo)', 'Cairo', 'sans-serif'],
        tajawal: ['var(--font-tajawal)', 'Tajawal', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        float: 'float 4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
      },
      boxShadow: {
        'burgundy-sm': '0 1px 3px rgba(123,30,58,0.08)',
        'burgundy-md': '0 4px 20px rgba(123,30,58,0.12)',
        'burgundy-lg': '0 10px 40px rgba(123,30,58,0.18)',
        'burgundy-xl': '0 20px 60px rgba(123,30,58,0.25)',
      },
    },
  },
  plugins: [],
};
