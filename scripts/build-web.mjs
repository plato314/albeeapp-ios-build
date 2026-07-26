import { copyFile, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, '..');
const output = join(root, 'www');

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

let html = await readFile(join(root, 'index.html'), 'utf8');
html = html
  .replace(
    '<script src="https://cdn.tailwindcss.com"></script>',
    '<link rel="stylesheet" href="./tailwind.css">'
  )
  .replace(
    '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>',
    '<script src="./chart.umd.js"></script>'
  )
  .replace(
    '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.css">',
    '<link rel="stylesheet" href="./fontawesome/css/all.min.css">'
  )
  .replace(
    '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">',
    ''
  )
  .replace(
    '<script src="./xlsx.full.min.js"></script>',
    '<script src="./native-bridge.js"></script>\n  <script src="./xlsx.full.min.js"></script>'
  );

await writeFile(join(output, 'index.html'), html);

for (const filename of [
  'app-icon-180.png',
  'app-icon-192.png',
  'app-icon-512.png',
  'manifest.json',
  'service-worker.js',
  'xlsx.full.min.js'
]) {
  await copyFile(join(root, filename), join(output, filename));
}

await copyFile(
  join(root, 'node_modules', 'chart.js', 'dist', 'chart.umd.js'),
  join(output, 'chart.umd.js')
);
await cp(
  join(root, 'node_modules', '@fortawesome', 'fontawesome-free', 'css'),
  join(output, 'fontawesome', 'css'),
  { recursive: true }
);
await cp(
  join(root, 'node_modules', '@fortawesome', 'fontawesome-free', 'webfonts'),
  join(output, 'fontawesome', 'webfonts'),
  { recursive: true }
);

await build({
  entryPoints: [join(root, 'src', 'native-bridge.js')],
  outfile: join(output, 'native-bridge.js'),
  bundle: true,
  format: 'iife',
  platform: 'browser',
  minify: true,
  sourcemap: false
});

console.log('Native mobile web assets prepared in www/');
