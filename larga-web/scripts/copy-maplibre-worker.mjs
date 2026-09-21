import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const from = join(root, 'node_modules', 'maplibre-gl', 'dist');
const to = join(root, 'public', 'maplibre');

const FILES = ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs'];

await mkdir(to, { recursive: true });
await Promise.all(FILES.map((file) => copyFile(join(from, file), join(to, file))));

const { version } = JSON.parse(
  await readFile(join(root, 'node_modules', 'maplibre-gl', 'package.json'), 'utf8')
);
console.log(`copied maplibre-gl ${version} worker files to public/maplibre/`);
