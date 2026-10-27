export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['var(--font-sans, "Tajawal")', 'system-ui', 'sans-serif'] },
      colors: {
        brand: {
          50:'rgb(var(--brand-50, 238 247 255) / <alpha-value>)',
          100:'rgb(var(--brand-100, 217 237 255) / <alpha-value>)',
          200:'rgb(var(--brand-200, 188 224 255) / <alpha-value>)',
          300:'rgb(var(--brand-300, 142 205 255) / <alpha-value>)',
          400:'rgb(var(--brand-400, 89 176 255) / <alpha-value>)',
          500:'rgb(var(--brand-500, 51 141 255) / <alpha-value>)',
          600:'rgb(var(--brand-600, 30 111 230) / <alpha-value>)',
          700:'rgb(var(--brand-700, 23 87 181) / <alpha-value>)',
          800:'rgb(var(--brand-800, 24 74 148) / <alpha-value>)',
          900:'rgb(var(--brand-900, 25 63 122) / <alpha-value>)',
        },
        accent: {
          50:'rgb(var(--accent-50, 255 247 237) / <alpha-value>)',
          100:'rgb(var(--accent-100, 255 237 213) / <alpha-value>)',
          200:'rgb(var(--accent-200, 254 215 170) / <alpha-value>)',
          300:'rgb(var(--accent-300, 253 186 116) / <alpha-value>)',
          400:'rgb(var(--accent-400, 251 146 60) / <alpha-value>)',
          500:'rgb(var(--accent-500, 249 115 22) / <alpha-value>)',
          600:'rgb(var(--accent-600, 234 88 12) / <alpha-value>)',
          700:'rgb(var(--accent-700, 194 65 12) / <alpha-value>)',
          800:'rgb(var(--accent-800, 154 52 18) / <alpha-value>)',
          900:'rgb(var(--accent-900, 124 45 18) / <alpha-value>)',
        }
      }
    }
  },
  plugins: []
};
