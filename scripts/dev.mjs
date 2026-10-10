import { spawn } from 'node:child_process';
import process from 'node:process';

const apps = [
  { name: 'customer', color: '\x1b[36m', port: '5173' },
  { name: 'driver', color: '\x1b[33m', port: '5174' },
  { name: 'admin', color: '\x1b[35m', port: '5175' },
];

const reset = '\x1b[0m';

for (const app of apps) {
  const child = spawn('npm', ['run', 'dev', `--workspace=apps/${app.name}-web`], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, PORT: app.port },
  });
  child.on('exit', (code) => process.exitCode ??= code ?? 0);
}

process.on('SIGINT', () => {
  process.exit();
});
