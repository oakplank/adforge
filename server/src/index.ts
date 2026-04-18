import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Load .env relative to this file before importing app.ts — otherwise the
// image router would be created with process.env unpopulated, since static
// imports hoist above any code that runs here.
const thisDir = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(thisDir, '../.env') });

const { default: app } = await import('./app.js');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`AdForge server running on port ${PORT}`);
});
