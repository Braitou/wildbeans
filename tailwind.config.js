/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/app/**/*.{js,ts,jsx,tsx}",
      "./src/components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        fontFamily: {
          // On branchera la font locale via la CSS variable
          sans: ['var(--font-fragmentmono)', 'ui-sans-serif', 'system-ui'],
        },
      },
    },
    plugins: [],
  };
  