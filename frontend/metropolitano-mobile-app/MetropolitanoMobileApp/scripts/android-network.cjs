const { withAndroidManifest, withDangerousMod } = require('expo/config-plugins');
const fs = require('node:fs/promises');
const path = require('node:path');

// ADB reverse permite probar el APK por USB sin dar acceso HTTP a otros hosts.
module.exports = function androidNetwork(config) {
  config = withAndroidManifest(config, mod => {
    const app = mod.modResults.manifest.application[0].$;
    app['android:allowBackup'] = 'false';
    app['android:networkSecurityConfig'] = '@xml/network_security_config';
    return mod;
  });
  return withDangerousMod(config, ['android', async mod => {
    const xml = path.join(mod.modRequest.platformProjectRoot, 'app/src/main/res/xml');
    await fs.mkdir(xml, { recursive: true });
    await fs.writeFile(path.join(xml, 'network_security_config.xml'),
      '<network-security-config><base-config cleartextTrafficPermitted="false"/>' +
      '<domain-config cleartextTrafficPermitted="true"><domain includeSubdomains="false">localhost</domain>' +
      '<domain includeSubdomains="false">127.0.0.1</domain></domain-config></network-security-config>\n');
    return mod;
  }]);
};
