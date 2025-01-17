module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Add the following lines to handle 'crypto' and 'fs' dependencies
      webpackConfig.resolve.fallback = {
        fs: require.resolve("browserify-fs"), // or 'empty' if you prefer an empty module
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        path: require.resolve("path-browserify"),
      };

      // Add the 'module' configuration for handling .wasm files
      webpackConfig.module.rules.push({
        test: /\.wasm$/,
        type: 'javascript/auto',
      });

      // Add configuration for handling .sqlite files
      webpackConfig.module.rules.push({
        test: /\.sqlite$/,
        use: 'file-loader',
      });

      return webpackConfig;
    },
  },
};
