import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        neuro: {
          light: '#c5c5c5',
          base: '#b8b8b8',
          dark: '#a0a0a0',
          darker: '#8a8a8a',
        },
        custom: {
          'bg-light': '#36363C',
          'bg-dark': '#111114',
          'shadow-light': '#42424A',
          'shadow-dark': '#0A0A0C',
          'highlight': '#4A4A52',
          'surface': '#2A2A30',
        }
      },
      boxShadow: {
        'neuro-inset': 'inset 4px 4px 8px #9a9a9a, inset -4px -4px 8px #d6d6d6',
        'neuro-outset': '4px 4px 8px #9a9a9a, -4px -4px 8px #d6d6d6',
        'neuro-flat': '2px 2px 4px #9a9a9a, -2px -2px 4px #d6d6d6',
        'neuro-pressed': 'inset 2px 2px 4px #9a9a9a, inset -2px -2px 4px #d6d6d6',
        'neuro-deep': 'inset 6px 6px 12px #9a9a9a, inset -6px -6px 12px #d6d6d6',
        // Custom dark neumorphic shadows - refined for your color scheme
        'neuro-dark-inset': 'inset 3px 3px 6px #0A0A0C, inset -3px -3px 6px #42424A',
        'neuro-dark-outset': '3px 3px 6px #0A0A0C, -3px -3px 6px #42424A',
        'neuro-dark-flat': '2px 2px 4px #0A0A0C, -2px -2px 4px #42424A',
        'neuro-dark-pressed': 'inset 2px 2px 4px #0A0A0C, inset -2px -2px 4px #42424A',
        'neuro-dark-deep': '6px 6px 12px #060608, -6px -6px 12px #35353A',
        'neuro-dark-deeper': '8px 8px 16px #050507, -8px -8px 16px #33333B',
        'neuro-dark-subtle': '1px 1px 2px #0A0A0C, -1px -1px 2px #42424A',
      },
    },
  },
  plugins: [
    require('tailwindcss-neumorphism-ui')
  ],
};
export default config;
