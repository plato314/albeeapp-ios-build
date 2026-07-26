import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const packageFile = resolve('ios', 'App', 'CapApp-SPM', 'Package.swift');
const source = await readFile(packageFile, 'utf8');
const normalized = source.replace(
  /path: "([^"]+)"/g,
  (_, value) => `path: "${value.replaceAll('\\', '/')}"`
);

if (normalized.includes('path: "..\\')) {
  throw new Error('Capacitor generated invalid Windows separators in Package.swift');
}

if (normalized !== source) {
  await writeFile(packageFile, normalized);
  console.log('Normalized iOS Swift package paths for macOS/Xcode.');
} else {
  console.log('iOS Swift package paths are already portable.');
}
