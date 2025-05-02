// next.config.js

module.exports = {
  reactStrictMode: true,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.tflite$/,
      use: 'file-loader',
    });
    return config;
  },
};
