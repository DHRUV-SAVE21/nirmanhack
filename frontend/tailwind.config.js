/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                'organic-green': {
                    DEFAULT: '#15803d',
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    200: '#bbf7d0',
                    300: '#86efac',
                    400: '#4ade80',
                    500: '#22c55e',
                    600: '#16a34a',
                    700: '#15803d',
                    800: '#166534',
                    900: '#14532d',
                },
                'gov-blue': {
                    DEFAULT: '#2563eb',
                    50: '#eff6ff',
                    100: '#dbeafe',
                    light: '#60a5fa',
                    dark: '#1e40af',
                },
                'wheat': {
                    DEFAULT: '#D4A03C',
                    light: '#E8C468',
                    dark: '#B8860B',
                },
                'soil': {
                    DEFAULT: '#8B4513',
                    light: '#A0522D',
                    dark: '#654321',
                },
                'earth-brown': {
                    DEFAULT: '#8D6E63',
                    light: '#A1887F',
                    dark: '#5D4037',
                },
                'dark-navy': {
                    DEFAULT: '#1e293b',
                    light: '#334155',
                    accent: '#0f172a',
                },
                'status': {
                    success: '#059669',
                    warning: '#d97706',
                    danger: '#dc2626',
                    info: '#0284c7',
                },
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Outfit', 'sans-serif'],
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'slide-up': 'slideUp 0.5s ease-out forwards',
                'slide-in-right': 'slideInRight 0.3s ease-out forwards',
                'slide-in-left': 'slideInLeft 0.3s ease-out forwards',
                'fade-in': 'fadeIn 0.3s ease-out forwards',
                'spin-slow': 'spin 3s linear infinite',
                'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideInRight: {
                    '0%': { opacity: '0', transform: 'translateX(100%)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                slideInLeft: {
                    '0%': { opacity: '0', transform: 'translateX(-100%)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                bounceGentle: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-8px)' },
                },
                glow: {
                    '0%': { boxShadow: '0 0 5px rgba(22, 163, 74, 0.5)' },
                    '100%': { boxShadow: '0 0 20px rgba(22, 163, 74, 0.8), 0 0 40px rgba(22, 163, 74, 0.4)' },
                },
            },
            boxShadow: {
                'gov': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                'gov-md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                'gov-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                'green-glow': '0 0 20px rgba(22, 163, 74, 0.3)',
                'inner-light': 'inset 0 2px 4px 0 rgb(255 255 255 / 0.05)',
            },
        },
    },
    plugins: [],
}
