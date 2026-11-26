import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const branch = process.env.WORKERS_CI_BRANCH;
if (branch && branch !== 'staging') {
  console.log(`Skipping the integration Preview for branch ${branch}.`);
  process.exit(0);
}

const worker = 'ludusales';
const buildWorker = process.env.WRANGLER_CI_OVERRIDE_NAME;
if (buildWorker && buildWorker !== worker) {
  throw new Error(`The integration Preview must target ${worker}.`);
}

const wrangler = fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url));
const { status, error } = spawnSync(process.execPath, [
  wrangler, 'preview', '--worker-name', worker, '--name', 'staging',
  '--config', 'cloudflare/wrangler.preview.jsonc',
], { cwd: fileURLToPath(new URL('../', import.meta.url)), stdio: 'inherit' });
if (error) throw error;
process.exitCode = status ?? 1;
