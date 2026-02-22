module.exports = {
  plugins: {
    'postcss-nesting': {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production'
      ? {
          '@fullhuman/postcss-purgecss': {
            content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
            defaultExtractor: (content) => content.match(/[\w-/:]+(?<!:)/g) || [],
            safelist: {
              standard: [
                /^bs-/,
                /^modal/,
                /^show/,
                /^fade/,
                /^collapse/,
                /^dropdown/,
                /^offcanvas/,
                /^navbar/,
              ],
            },
          },
        }
      : {}),
  },
};
