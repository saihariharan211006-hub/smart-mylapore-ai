/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-obsidian': '#050816',
        'dark-navy': '#09111F',
        'glass-bg': 'rgba(17, 24, 39, 0.65)',
        'electric-cyan': '#00E5FF',
        'royal-blue': '#3B82F6',
        'deep-purple': '#6D5DFB',
        'neon-green': '#22C55E',
        'neon-orange': '#FFB000',
        'border-glass': 'rgba(255, 255, 255, 0.08)'
      },
      fontFamily: {
        'sans': ['Inter', 'Poppins', 'sans-serif'],
        'display': ['Outfit', 'Poppins', 'sans-serif']
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(0, 229, 255, 0.25)',
        'neon-purple': '0 0 20px rgba(109, 93, 251, 0.25)',
        'neon-green': '0 0 20px rgba(34, 197, 94, 0.25)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      }
    },
  },
  plugins: [],
}
