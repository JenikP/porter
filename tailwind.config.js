/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './apps/customer-web/src/**/*.{ts,tsx}',
    './apps/driver-web/src/**/*.{ts,tsx}',
    './apps/admin-web/src/**/*.{ts,tsx}',
    './packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
        },
      },
    },
  },
  plugins: [],
};
