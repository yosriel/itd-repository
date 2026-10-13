const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(__dirname, 'reference/metropolitano_perfil.html'), 'utf8');
const expression = html.match(/const state = ([\s\S]*?);\s*\/\/ ---------------- NAV/)[1];
const fixtures = vm.runInNewContext(`(${expression})`, {}, { timeout: 1000 });
const targets = [
  'frontend/metropolitano-mobile-app/MetropolitanoMobileApp/src/data/fixtures.json',
  'backend/metropolitano-backend-api/src/main/resources/demo/fixtures.json',
];
for (const target of targets) {
  const file = path.join(root, target);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(fixtures, null, 2) + '\n');
}
