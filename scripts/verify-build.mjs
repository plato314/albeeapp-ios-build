import { access, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve('.');
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const source = await readFile(join(root, 'index.html'), 'utf8');
const built = await readFile(join(root, 'www', 'index.html'), 'utf8');

const inlineScripts = [...source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1])
  .filter(script => script.trim());
for (const script of inlineScripts) new Function(script);

for (const filename of [
  'tailwind.css',
  'native-bridge.js',
  'chart.umd.js',
  'fontawesome/css/all.min.css',
  'xlsx.full.min.js'
]) {
  await access(join(root, 'www', filename));
}

if (/cdn\.tailwindcss\.com|cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|fonts\.googleapis\.com/.test(built)) {
  throw new Error('Native mobile build still contains a CDN dependency');
}
if (!built.includes('./native-bridge.js')) throw new Error('Native bridge is missing');
if (!source.includes(`const APP_VERSION = '${pkg.version}'`)) throw new Error('Unexpected app version');

console.log('Mobile web verification passed: syntax, local assets, native bridge and version');
