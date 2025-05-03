// next.config.js
module.exports = {
  webpack(config) {
    config.module.rules.push({
      test: /\.bin$/,
      use: 'file-loader', // Ensure .bin files are served as static assets
    });
    return config;
  },
};
