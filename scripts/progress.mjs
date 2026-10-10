import fs from 'node:fs';
const [number, status, summary, files = '', checks = 'npm run typecheck'] = process.argv.slice(2);
const spec = fs.readFileSync('PORTER_CONNECTED_FRONTEND_TASKS.txt', 'utf8');
const title = spec.match(new RegExp(`TASK ${number}[^\\r\\n]*`))?.[0] ?? `Task ${number}`;
const report = `# ${title}\n\nStatus: ${status}\n\n## What was built\n${summary}\n\n## Files created / modified\n${files.split(',').map(f => '- ' + f).join('\n')}\n\n## Commands and tests run\n${checks}\n\n## Test results\n${status === 'PASS' ? 'Passed the checks listed above. See FINAL-BUILD-REPORT.md for final cross-role evidence.' : 'Implementation recorded; full rendered validation is pending. This is not a verified pass.'}\n\n## Assumptions\nFrontend-only Melbourne simulation; AUD; configurable prototype rules, no external services.\n\n## Unresolved issues / limitations\n${status === 'PASS' ? 'No known blocking issue in this task. Integrations remain simulated.' : 'Pending final connected UI verification.'}\n\n## Safe to continue\nYes; continue sequentially, repairing failures.\n\n## Next task\n${number === '37' ? 'Final handoff' : String(Number(number) + 1).padStart(2, '0')}\n`;
fs.mkdirSync('docs/progress', { recursive: true });
fs.writeFileSync(`docs/progress/TASK-${number}-report.md`, report);
const rows = fs.readdirSync('docs/progress').filter(f => /^TASK-\d+-report\.md$/.test(f)).sort().map(f => {
 const text = fs.readFileSync('docs/progress/' + f, 'utf8');
 const n = f.slice(5, 7);
 const s = text.match(/Status:\*?\*?\s*(PASS|PARTIAL|FAIL)/i)?.[1] ?? 'PARTIAL';
 return `| ${n} | ${s} | ${text.split('\n')[0].replace(/^# /, '')} | [${f}](./${f}) |`;
});
fs.writeFileSync('docs/progress/BUILD-STATUS.md', '# Porter build status\n\n| Task | Status | Summary | Report File |\n|---|---|---|---|\n' + rows.join('\n') + '\n');
fs.writeFileSync('BUILD-STATUS.md', fs.readFileSync('docs/progress/BUILD-STATUS.md', 'utf8').replaceAll('](./TASK-', '](./docs/progress/TASK-'));
