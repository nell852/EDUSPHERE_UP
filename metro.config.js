const { getDefaultConfig } = require('expo/metro-config');


const config = getDefaultConfig(__dirname);
module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  config.resolver.platforms = ['ios', 'android', 'web'];
  config.resolver.alias = {
    ...config.resolver.alias,
    'react-native-blob-util': './src/react-native-blob-util.web.js',
    'react-native-pdf': './src/react-native-pdf.web.js',
  };

  return config;
})();