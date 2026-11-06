// npm run serve — phục vụ dist/ để xem thử và cho Playwright.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { siteDir } from './lib/model.mjs';

const root = path.join(siteDir, 'dist');
const port = Number(process.env.PORT ?? 4173);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

http.createServer((request, response) => {
  let pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = path.join(root, pathname);
  if (!file.startsWith(root)) { response.writeHead(403); response.end(); return; }
  fs.readFile(file, (error, body) => {
    if (error) {
      response.writeHead(404, { 'content-type': types['.html'] });
      response.end(fs.existsSync(path.join(root, '404.html')) ? fs.readFileSync(path.join(root, '404.html')) : 'Not found');
      return;
    }
    response.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' });
    response.end(body);
  });
}).listen(port, '127.0.0.1', () => console.log(`Blueprint site: http://localhost:${port}/`));
