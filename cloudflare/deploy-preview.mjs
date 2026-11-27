import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, rmdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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
const args = [
  wrangler, 'preview', '--worker-name', worker, '--name', 'staging',
  '--config', 'cloudflare/wrangler.preview.jsonc',
];

const clientId = process.env.PREVIEW_API_CLIENT_ID?.trim();
const clientSecret = process.env.PREVIEW_API_CLIENT_SECRET?.trim();
if (Boolean(clientId) !== Boolean(clientSecret)) {
  throw new Error('Set both PREVIEW_API_CLIENT_ID and PREVIEW_API_CLIENT_SECRET for the integration Preview.');
}

const secretsDirectory = clientId ? mkdtempSync(join(tmpdir(), 'ludusales-preview-')) : undefined;
const secretsFile = secretsDirectory && join(secretsDirectory, 'secrets.json');

try {
  if (secretsFile) {
    writeFileSync(secretsFile, JSON.stringify({
      PREVIEW_API_CLIENT_ID: clientId,
      PREVIEW_API_CLIENT_SECRET: clientSecret,
    }), { mode: 0o600, flag: 'wx' });
    args.push('--secrets-file', secretsFile);
  }

  const { status, error } = spawnSync(process.execPath, args, {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    stdio: 'inherit',
  });
  if (error) throw error;
  process.exitCode = status ?? 1;
} finally {
  if (secretsDirectory && secretsFile) {
    rmSync(secretsFile, { force: true });
    rmdirSync(secretsDirectory);
  }
}
