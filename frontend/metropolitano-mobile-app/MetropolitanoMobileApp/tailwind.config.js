module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        navy: '#0B3552',
        steel: '#00897E',
        amber: '#F5A623',
        critical: '#D6483C',
        ink: '#14202B',
        muted: '#5B6B7A',
        line: '#E4E9EE',
        canvas: '#F4F6F8',
      },
      fontFamily: { sans: ['Manrope'], title: ['Fraunces'] },
    },
  },
  plugins: [],
};
