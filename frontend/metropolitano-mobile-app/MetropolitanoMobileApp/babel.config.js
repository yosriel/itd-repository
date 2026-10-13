module.exports = api => {
  const test = api.env('test');
  return {
    presets: test
      ? ['module:@react-native/babel-preset']
      : [
          [
            'module:@react-native/babel-preset',
            { jsxImportSource: 'nativewind' },
          ],
          'nativewind/babel',
        ],
    plugins: test ? [] : ['react-native-worklets/plugin'],
  };
};
