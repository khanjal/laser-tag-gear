/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        ops: {
          paper: 'rgb(var(--ops-paper) / <alpha-value>)',
          surface: 'rgb(var(--ops-surface) / <alpha-value>)',
          grid: 'rgb(var(--ops-grid) / <alpha-value>)',
          ink: 'rgb(var(--ops-ink) / <alpha-value>)',
          laser: 'rgb(var(--ops-laser) / <alpha-value>)',
          ember: 'rgb(var(--ops-ember) / <alpha-value>)',
          moss: 'rgb(var(--ops-moss) / <alpha-value>)'
        }
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        body: ['Chakra Petch', 'sans-serif']
      },
      boxShadow: {
        scan: '0 0 0 1px rgba(0, 228, 255, 0.4), 0 0 0 3px rgba(255, 122, 26, 0.1), 0 12px 30px rgba(26, 18, 8, 0.2)'
      }
    },
  },
  plugins: [],
}

