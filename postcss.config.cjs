// PurgeCSS disabled: it was stripping Bootstrap/layout classes used by the login page
// (d-flex, row, col-*, container-*, vh-100, etc.). Re-enable only with a full Bootstrap
// safelist or by running PurgeCSS only on a subset of CSS.
module.exports = {
  plugins: {
    'postcss-nesting': {},
    autoprefixer: {},
  },
};
