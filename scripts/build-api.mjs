import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
await build({absWorkingDir:root,entryPoints:['services/api/src/launch/server.mjs'],outfile:'services/api/dist/server.mjs',bundle:true,platform:'node',format:'esm',target:'node22',external:['pg'],alias:Object.fromEntries(['shared','domain','config'].map(n=>['@porter/'+n,path.join(root,'packages/'+n+'/src/index.ts')]))});
