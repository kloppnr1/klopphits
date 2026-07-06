#!/usr/bin/env node
// Lille afhaengighedsfri statisk server til koncept-UI'et i docs/.
// Koer med: npm run serve  (aabner http://localhost:8080)
// Paa din egen PC henter siden de rigtige videoer/covers - ingen placeholders.
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'docs');
const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  // Bloker sti-traversering ud af docs/
  const filePath = path.join(ROOT, urlPath);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 - ' + urlPath);
      return;
    }
    const type = TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    // Range-support, saa video kan spole/streame som paa en rigtig server
    const range = req.headers.range;
    if (range && /^bytes=/.test(range)) {
      const [startStr, endStr] = range.replace('bytes=', '').split('-');
      const start = parseInt(startStr, 10) || 0;
      const end = endStr ? parseInt(endStr, 10) : stat.size - 1;
      res.writeHead(206, {
        'Content-Type': type,
        'Content-Range': 'bytes ' + start + '-' + end + '/' + stat.size,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': stat.size, 'Accept-Ranges': 'bytes' });
      fs.createReadStream(filePath).pipe(res);
    }
  });
});

server.listen(PORT, () => {
  console.log('KloppHits koncept-UI koerer paa:');
  console.log('  http://localhost:' + PORT + '/');
  console.log('Tryk Ctrl+C for at stoppe.');
});
