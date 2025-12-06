module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', {
        root: ['./'],
        alias: {
          'react-native/Libraries/Components/SafeAreaView/SafeAreaView': 'react-native-safe-area-context',
        },
      }],
    ],
  };
};
