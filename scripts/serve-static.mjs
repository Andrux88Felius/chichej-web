import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, relative, extname, isAbsolute } from 'node:path';

// Servidor local del piloto: solo expone public/, sin PHP ni dependencias npm.
const root = fileURLToPath(new URL('../public/', import.meta.url));
const port = Number(process.argv[2] || 8080);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg' };
const server = http.createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return;
  }
  try {
    const requestedPath = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    if (requestedPath === '/usuario') {
      response.writeHead(308, { Location: '/usuario/' }); response.end(); return;
    }
    const pathname = requestedPath.endsWith('/') ? requestedPath + 'index.html' : requestedPath;
    const path = resolve(root, '.' + pathname);
    const within = relative(root, path);
    if (within.startsWith('..') || isAbsolute(within) || !types[extname(path)]) throw new Error('Not public');
    const info = await stat(path);
    if (!info.isFile()) throw new Error('Not a file');
    response.writeHead(200, { 'Content-Type': types[extname(path)], 'Content-Length': info.size, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    if (request.method === 'HEAD') response.end();
    else createReadStream(path).on('error', () => response.destroy()).pipe(response);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); response.end('Recurso no disponible en el piloto.');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`CHICHEJ portable: http://localhost:${port}/`));
