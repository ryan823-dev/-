import { build } from 'esbuild';

await build({
  entryPoints: ['server.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile: 'api/index.mjs',
  external: [
    'express',
    'cors',
    'body-parser',
    'helmet',
    'mongoose',
    'dotenv',
    '@google/genai',
    'jsonwebtoken',
    'twitter-api-v2',
    'express-rate-limit',
    'node-cron',
    'googleapis',
    'vite',
    'cheerio',
    'multer',
  ],
  banner: {
    js: [
      "import { createRequire as __createRequire } from 'module';",
      "import { fileURLToPath as __fileURLToPath } from 'url';",
      "import { dirname as __dirname_fn } from 'path';",
      "const require = __createRequire(import.meta.url);",
      "const __filename = __fileURLToPath(import.meta.url);",
      "const __dirname = __dirname_fn(__filename);",
    ].join('\n'),
  },
});

console.log('API bundle built → api/index.mjs');
