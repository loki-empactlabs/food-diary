module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Transform import.meta.env → process.env for Metro compatibility
      // (Zustand devtools uses import.meta.env.MODE which breaks in non-module scripts)
      './plugins/babel-import-meta.js',
    ],
  };
};
