module.exports = function (api) {
  api.cache(true);
  const isTest = process.env.NODE_ENV === 'test';
  if (isTest) {
    // reanimated: false prevents babel-preset-expo from loading reanimated/plugin
    // in Jest — react-native-worklets (required by reanimated v4 plugin) is not installed
    return {
      presets: [['babel-preset-expo', { reanimated: false }]],
    };
  }
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};