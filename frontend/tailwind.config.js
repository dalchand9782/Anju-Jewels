/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#E0C097',
          foreground: '#2D2D2D',
        },
        secondary: {
          DEFAULT: '#FDFBF7',
          foreground: '#2D2D2D',
        },
        accent: {
          DEFAULT: '#FCEDEF',
          foreground: '#5A3E3E',
        },
        muted: {
          DEFAULT: '#F5F0EB',
          foreground: '#8A8A8A',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
      },
      fontFamily: {
        heading: ['Playfair Display', 'serif'],
        body: ['Manrope', 'sans-serif'],
        accent: ['Cormorant Garamond', 'serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(224, 192, 151, 0.15)',
        'hover': '0 10px 30px -4px rgba(224, 192, 151, 0.25)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};