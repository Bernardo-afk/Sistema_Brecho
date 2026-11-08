/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: { DEFAULT: '#f6f1e7', 50: '#fbf8f2', 100: '#f6f1e7', 200: '#ece3d3', 300: '#e0d3bc' },
        sand: { DEFAULT: '#d9c9ad', 400: '#c8b391', 500: '#b39a74' },
        tobacco: { DEFAULT: '#8a6a4a', 600: '#755838' },
        walnut: { DEFAULT: '#4a2f1d', 700: '#3b2416', 800: '#2f1d12' },
        espresso: '#22160f',
        brass: { DEFAULT: '#b08a40', light: '#cdae6e' },
        oxblood: '#7a2e22',
        sage: '#6f7a5c',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(34,22,15,.06), 0 8px 24px -8px rgba(34,22,15,.18)',
        lift: '0 2px 4px rgba(34,22,15,.06), 0 18px 40px -12px rgba(34,22,15,.30)',
      },
      keyframes: {
        fadeUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'none' } },
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn: { from: { transform: 'translateX(100%)' }, to: { transform: 'none' } },
        slideInLeft: { from: { transform: 'translateX(-100%)' }, to: { transform: 'none' } },
        pulseRing: { '0%': { transform: 'scale(.8)', opacity: .9 }, '100%': { transform: 'scale(2.2)', opacity: 0 } },
      },
      animation: {
        fadeUp: 'fadeUp .6s cubic-bezier(.2,.7,.2,1) both',
        fadeIn: 'fadeIn .4s ease both',
        slideIn: 'slideIn .35s cubic-bezier(.2,.7,.2,1) both',
        slideInLeft: 'slideInLeft .35s cubic-bezier(.2,.7,.2,1) both',
        pulseRing: 'pulseRing 1.8s ease-out infinite',
      },
    },
  },
  plugins: [],
};
