/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        ops: {
          paper: '#f4f1e8',
          surface: '#fffaf0',
          grid: '#d5ccb8',
          ink: '#121417',
          laser: '#00c2d7',
          ember: '#ff6a00',
          moss: '#365a3f'
        }
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        body: ['Rajdhani', 'sans-serif']
      },
      boxShadow: {
        scan: '0 0 0 1px rgba(0, 194, 215, 0.25), 0 10px 30px rgba(18, 20, 23, 0.12)'
      }
    },
  },
  plugins: [],
}

