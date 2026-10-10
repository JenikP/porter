import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = process.env.PORT || 5173;
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  const safePath = normalize(pathname).replace(/^([/\\]\.\.)+/, '');
  const filePath = join(root, safePath === '/' ? 'index.html' : safePath.replace(/^[/\\]/, ''));

  if (!filePath.startsWith(root) || !existsSync(filePath) || statSync(filePath).isDirectory()) {
    const fallbackPath = join(root, 'index.html');
    response.writeHead(200, { 'Content-Type': mimeTypes['.html'] });
    createReadStream(fallbackPath).pipe(response);
    return;
  }

  response.writeHead(200, { 'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream' });
  createReadStream(filePath).pipe(response);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Porter prototype running at http://127.0.0.1:${port}`);
  console.log('Launcher: / · Customer: /customer · Driver: /driver · Admin: /admin');
});
