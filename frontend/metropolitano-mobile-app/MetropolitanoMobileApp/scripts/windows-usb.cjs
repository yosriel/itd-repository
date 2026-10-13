/* Windows SUBST mappings can differ between desktop and terminal sessions. */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function main() {
  if (process.platform !== 'win32') {
    throw new Error('Este comando es para Windows. Usa los scripts android/start en otras plataformas.');
  }
  const projectRoot = fs.realpathSync.native(path.resolve(__dirname, '..'));
  const alias = 'M:\\';
  if (fs.existsSync(alias)) {
    if (fs.realpathSync.native(alias).toLowerCase() !== projectRoot.toLowerCase()) {
      throw new Error('M: pertenece a otra carpeta. No se modifico esa unidad.');
    }
  } else {
    const mapping = spawnSync('subst.exe', ['M:', projectRoot], { encoding: 'utf8' });
    if (mapping.error || mapping.status !== 0) {
      throw new Error(mapping.error?.message || mapping.stderr || 'No se pudo crear M: en esta terminal.');
    }
  }
  if (!fs.existsSync(path.join(alias, 'node_modules/react-native-safe-area-context/android'))) {
    throw new Error('Faltan dependencias. Ejecuta npm ci dentro del proyecto movil.');
  }
  const mode = process.argv[2];
  const portIndex = process.argv.indexOf('--port');
  const port = portIndex === -1 ? '8082' : process.argv[portIndex + 1];
  if (!/^\d+$/.test(port || '') || Number(port) < 1024 || Number(port) > 65535) {
    throw new Error('Puerto invalido. Ejemplo: --port 8082');
  }
  console.log(`Unidad M: lista. Metro: puerto ${port}.`);
  if (mode === 'check') { return; }
  if (mode !== 'start' && mode !== 'android') { throw new Error('Modo desconocido.'); }
  if (mode === 'android') {
    const devices = spawnSync('adb', ['devices'], { encoding: 'utf8' });
    if (devices.error || devices.status !== 0) { throw new Error('No se pudo ejecutar adb. Revisa Android SDK.'); }
    const connected = devices.stdout.split(/\r?\n/).map(line => line.match(/^(\S+)\s+device$/)).filter(Boolean);
    if (connected.length !== 1) {
      throw new Error('Conecta un unico telefono Android, desbloquealo y acepta la depuracion USB. Comprueba adb devices.');
    }
    const reverse = spawnSync('adb', ['-s', connected[0][1], 'reverse', `tcp:${port}`, `tcp:${port}`], { stdio: 'inherit' });
    if (reverse.status !== 0) { throw new Error('No se pudo conectar el puerto por USB.'); }
    const backendReverse = spawnSync('adb', ['-s', connected[0][1], 'reverse', 'tcp:8080', 'tcp:8080'], { stdio: 'inherit' });
    if (backendReverse.status !== 0) { throw new Error('No se pudo conectar Spring por USB.'); }
  }
  const args = mode === 'start'
    ? ['start', '--port', port, '--reset-cache']
    : ['run-android', '--port', port, '--no-packager'];
  // NativeWind's generated-style transformer compares absolute file paths.
  // Run Metro from the physical directory; keep SUBST only for Gradle/CMake.
  const launchRoot = mode === 'start' ? projectRoot : alias;
  const result = spawnSync(process.execPath, [path.join(launchRoot, 'node_modules/react-native/cli.js'), ...args], {
    cwd: launchRoot, stdio: 'inherit',
  });
  if (result.error) { throw result.error; }
  process.exitCode = result.status ?? 1;
}
try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
