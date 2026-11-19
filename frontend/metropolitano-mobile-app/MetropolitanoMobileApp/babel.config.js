module.exports = api => {
  const test = api.env('test');
  return {
    presets: test
      ? ['module:@react-native/babel-preset']
      : [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
  };
};
