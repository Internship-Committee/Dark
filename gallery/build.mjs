// Builds the gallery island into ../assets/ as two plain static files:
//   assets/circular-gallery.js   (IIFE bundle — works from file://, GitHub Pages, anywhere)
//   assets/circular-gallery.css  (only the Tailwind classes actually used, scoped to #circular-gallery-root)
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, '../assets');
const require = createRequire(import.meta.url);

await build({
  entryPoints: [path.join(here, 'src/main.tsx')],
  outfile: path.join(out, 'circular-gallery.js'),
  bundle: true,
  format: 'iife',
  minify: true,
  target: 'es2019',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"' },
  loader: { '.css': 'empty' }, // CSS is produced by the Tailwind step below
  legalComments: 'none',
  logLevel: 'info',
});

// Tailwind CLI (v3)
const tailwindCli = process.env.TAILWIND_CLI || require.resolve('tailwindcss/lib/cli.js');
execFileSync(
  process.execPath,
  [tailwindCli, '-c', path.join(here, 'tailwind.config.ts'), '-i', path.join(here, 'src/index.css'),
   '-o', path.join(out, 'circular-gallery.css'), '--minify'],
  { stdio: 'inherit', cwd: here },
);
console.log('✔ gallery built → assets/circular-gallery.{js,css}');
