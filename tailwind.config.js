/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Rajdhani', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        bg: {
          DEFAULT: '#0a0c10',
          2: '#0f1218',
          3: '#161b24',
          4: '#1c2230',
        },
        border: {
          DEFAULT: '#242d3e',
          2: '#2e3a50',
        },
        accent: {
          DEFAULT: '#f59e0b',
          2: '#fbbf24',
        },
        fuel: {
          ms: '#f59e0b',
          hsd: '#10b981',
          speed: '#3b82f6',
        }
      }
    }
  },
  plugins: []
}
