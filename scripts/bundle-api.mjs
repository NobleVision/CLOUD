/**
 * Bundle API functions for Vercel Serverless deployment
 * 
 * This script bundles each API function with all its dependencies
 * so they can run in Vercel's serverless environment
 */

import * as esbuild from 'esbuild';
import { glob } from 'glob';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

async function bundleApiFunctions() {
  console.log('📦 Bundling API functions for Vercel...\n');

  // Clean api-dist directory
  const apiDistDir = path.join(rootDir, 'api-dist');
  if (fs.existsSync(apiDistDir)) {
    fs.rmSync(apiDistDir, { recursive: true });
  }
  fs.mkdirSync(apiDistDir, { recursive: true });

  // Find all API function files (excluding _lib helpers and tsconfig)
  const apiFiles = await glob('api/**/*.ts', {
    cwd: rootDir,
    ignore: ['api/_lib/**', 'api/tsconfig.json'],
  });

  console.log(`Found ${apiFiles.length} API functions to bundle:\n`);
  apiFiles.forEach(f => console.log(`  - ${f}`));
  console.log('');

  // Bundle each API function
  for (const file of apiFiles) {
    const entryPoint = path.join(rootDir, file);
    const outDir = path.join(rootDir, 'api-dist', path.dirname(file));
    
    // Ensure output directory exists
    fs.mkdirSync(outDir, { recursive: true });

    try {
      await esbuild.build({
        entryPoints: [entryPoint],
        bundle: true,
        platform: 'node',
        target: 'node20',
        format: 'esm',
        outdir: outDir,
        outExtension: { '.js': '.mjs' },
        external: [
          // Don't bundle Node.js built-ins
          'node:*',
        ],
        banner: {
          js: `// Bundled for Vercel Serverless
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
`,
        },
        minify: false, // Keep readable for debugging
        sourcemap: false,
        treeShaking: true,
        // Handle path aliases
        alias: {
          '@shared': path.join(rootDir, 'shared'),
        },
      });
      console.log(`✅ Bundled: ${file}`);
    } catch (error) {
      console.error(`❌ Failed to bundle ${file}:`, error.message);
      process.exit(1);
    }
  }

  console.log('\n✨ All API functions bundled successfully!');
}

bundleApiFunctions().catch(err => {
  console.error('Bundle failed:', err);
  process.exit(1);
});
