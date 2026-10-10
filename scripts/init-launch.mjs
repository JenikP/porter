import { existsSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(?=[A-Za-z]:)/,'')),'..');
const file=path.join(root,'.env.launch');
if(!existsSync(file)){
 writeFileSync(file,`# Local development only; never commit this file\nNODE_ENV=development\nSQLITE_PATH=${path.join(root,'.data/porter-launch.sqlite').replaceAll('\\','/')}\nBOOTSTRAP_ADMIN_EMAIL=manager@porter.local\nBOOTSTRAP_ADMIN_PASSWORD=${randomBytes(24).toString('base64url')}\n`,{mode:0o600});
 console.log('Created ignored .env.launch with a generated local Manager Admin password. Read that local file to sign in; never use these settings in production.');
}
