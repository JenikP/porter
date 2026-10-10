const root = decodeURIComponent(new URL('../', import.meta.url).pathname).replace(/^\/(?=[A-Za-z]:)/, '');
export const aliases = Object.fromEntries(['shared','config','domain','mock-platform','ui','app-session'].map(name => [`@porter/${name}`, `${root}packages/${name}/src/index.ts`]));
