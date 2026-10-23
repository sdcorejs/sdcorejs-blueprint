import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist/consumer/browser');
if (!fs.existsSync(path.join(root, 'index.html'))) throw new Error('Run npm run build before serving production output');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.txt': 'text/plain' };
http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (pathname.startsWith('/api/')) { res.writeHead(501); res.end('Tests supply HTTP responses; no backend is bundled.'); return; }
  const file = path.resolve(root, '.' + pathname);
  if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
  const target = fs.existsSync(file) && fs.statSync(file).isFile() ? file : path.extname(pathname) ? null : path.join(root, 'index.html');
  if (!target) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': (types[path.extname(target)] ?? 'application/octet-stream'), 'Cache-Control': 'no-store' });
  fs.createReadStream(target).pipe(res);
}).listen(4317, '127.0.0.1', () => console.log('AOT consumer: http://127.0.0.1:4317'));
