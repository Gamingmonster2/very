/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cairo', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          500: '#7c3aed',
          600: '#6d28d9',
          700: '#5b21b6',
          900: '#2e1065',
          950: '#0f052d'
        },
        neonCyan: '#06b6d4',
        neonTeal: '#14b8a6',
        goldAccent: '#f59e0b',
        darkBg: '#030712',
        darkCard: '#0f172a',
      },
      boxShadow: {
        'neon-glow': '0 0 30px rgba(124, 58, 237, 0.25)',
        'cyan-glow': '0 0 30px rgba(6, 182, 212, 0.25)',
        'glass-glow': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }
    },
  },
  plugins: [],
};
