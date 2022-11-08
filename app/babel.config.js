module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          node: "current",
        },
      },
    ],
    "@babel/preset-react",
  ],
  plugins: ["@babel/plugin-proposal-class-properties"],
  env: {
    test: {
      plugins: ["transform-es2015-modules-commonjs"],
    },
  },
};
