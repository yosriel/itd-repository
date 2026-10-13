const path = require('node:path');
const nativeWindTransformer = require('react-native-css-interop/dist/metro/transformer');

exports.transform = (config, projectRoot, filename, data, options) => {
  // Metro uses forward slashes for module paths, including on Windows.
  // NativeWind 4 compares dirname(filename) with a Windows-formatted path.
  const normalizedFilename = path.normalize(filename);
  const normalizedConfig = {
    ...config,
    cssInterop_outputDirectory: path.dirname(normalizedFilename) ===
      path.normalize(config.cssInterop_outputDirectory)
      ? path.dirname(filename)
      : config.cssInterop_outputDirectory,
  };
  return nativeWindTransformer.transform(
    normalizedConfig, projectRoot, filename, data, options,
  );
};
