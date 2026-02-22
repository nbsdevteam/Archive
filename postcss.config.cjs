// PurgeCSS runs only in production and only on global CSS (skips *.module.css and node_modules).
const purgecss = require("@fullhuman/postcss-purgecss");

const purgecssOptions = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  defaultExtractor: (content) => {
    const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [];
    const innerMatches = content.match(/[^<>"'`\s.()]*[^<>"'`\s.():]/g) || [];
    return broadMatches.concat(innerMatches);
  },
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
      /^btn/,
      /^form/,
      /^input/,
      /^is-/,
      /^was-/,
      /^has-/,
      /^col-/,
      /^row/,
      /^container/,
      /^d-/,
      /^flex/,
      /^align/,
      /^justify/,
      /^text-/,
      /^bg-/,
      /^p-/,
      /^px-/,
      /^py-/,
      /^pt-/,
      /^pb-/,
      /^ps-/,
      /^pe-/,
      /^m-/,
      /^mx-/,
      /^my-/,
      /^mt-/,
      /^mb-/,
      /^ms-/,
      /^me-/,
      /^gap-/,
      /^w-/,
      /^h-/,
      /^border/,
      /^rounded/,
      /^shadow/,
      /^position-/,
      /^overflow-/,
      /^visually-/,
      /^sr-/,
      /^active/,
      /^disabled/,
      /^open/,
      /^rtl/,
      /^ltr/,
      // Login / auth global classes (from LoginPage, AuthShell, pages/_login.scss)
      /^login-/,
      /^authen/,
      /^authentication-card/,
      /^pass-group/,
      /^pass-input/,
      /^toggle-passwords/,
      /^main-wrapper/,
      /^bg-linear-gradiant/,
      /^container-fuild/,
      /^img-fluid/,
      /^display-1/,
      /^text-gray/,
      /^fw-/,
      /^fs-/,
      /^hover-a/,
      /^alert/,
    ],
    deep: [/^modal/, /^dropdown/, /^collapse/, /^offcanvas/],
    greedy: [/^data-bs-/],
  },
};

/** PostCSS plugin that runs PurgeCSS only when not processing CSS Modules or node_modules CSS. */
function conditionalPurgecss() {
  const purgecssPlugin = purgecss(purgecssOptions);
  return {
    postcssPlugin: "conditional-purgecss",
    OnceExit(root, result) {
      const file = root.source?.input?.file || "";
      const isModuleCss = file.endsWith(".module.css") || file.includes(".module.css");
      const isNodeModules = file.includes("node_modules");
      if (isModuleCss || isNodeModules) return;
      return purgecssPlugin.OnceExit(root, result);
    },
  };
}
conditionalPurgecss.postcss = true;

module.exports = {
  plugins: [
    require("postcss-nesting")(),
    require("autoprefixer")(),
    ...(process.env.NODE_ENV === "production" ? [conditionalPurgecss()] : []),
  ],
};
