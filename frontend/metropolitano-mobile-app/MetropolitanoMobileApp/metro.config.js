const fs = require('node:fs');
const path = require('node:path');
const projectRoot = fs.realpathSync.native(__dirname);
const rootRequire = require('node:module').createRequire(
  path.join(projectRoot, 'package.json'),
);
const { getDefaultConfig, mergeConfig } = rootRequire(
  '@react-native/metro-config',
);
const { withNativeWind } = rootRequire('nativewind/metro');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
// SUBST drives are useful for CMake on Windows, but Metro must watch the
// physical path: Node resolves dependencies back to it when loading modules.
const config = {
  projectRoot,
  serializer: {
    // Use the same physical path as the module graph, including under SUBST.
    getModulesRunBeforeMainModule: () => [
      rootRequire.resolve('react-native/setup-env'),
    ],
  },
};

const nativeWindConfig = withNativeWind(
  mergeConfig(getDefaultConfig(projectRoot), config),
  {
    input: path.join(projectRoot, 'global.css'),
  },
);

module.exports = {
  ...nativeWindConfig,
  transformerPath: path.join(projectRoot, 'scripts/nativewind-transformer.cjs'),
};
