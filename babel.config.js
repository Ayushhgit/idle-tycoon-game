module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@store': './src/store',
            '@hooks': './src/hooks',
            '@utils': './src/utils',
            '@constants': './src/constants',
            '@types': './src/types',
            '@services': './src/services',
            '@config': './src/config',
            '@lib': './src/lib',
            '@animations': './src/animations',
            '@systems': './src/systems',
            '@game': './src/game',
          },
        },
      ],
      // Reanimated 4 — worklets plugin must be listed LAST
      'react-native-worklets/plugin',
    ],
  };
};
