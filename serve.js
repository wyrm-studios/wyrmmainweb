/**
 * WYRM.studios — Local Development Server
 * ----------------------------------------
 * Serves the static site locally so you can preview it
 * exactly as it would look when deployed.
 *
 * Usage:
 *   node serve.js
 *
 * Then open http://localhost:3000 in your browser.
 * Press Ctrl+C to stop the server.
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');
const url  = require('url');

const PORT    = 8080;
const ROOT    = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.otf':  'font/otf',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.txt':  'text/plain; charset=utf-8',
  '.xml':  'application/xml; charset=utf-8',
};

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

/* Dev convenience: never let the browser cache code files, so edits show up
   on plain reloads. Images/media keep default (heuristic) caching. */
function getCacheControl(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ['.html', '.js', '.css', '.xml', '.json'].includes(ext)
    ? 'no-cache'
    : null;
}

const server = http.createServer((req, res) => {
  // Parse the request URL (strip query strings)
  let pathname = new URL(req.url, 'http://localhost').pathname;

  // Decode URI components to handle spaces and special chars
  try {
    pathname = decodeURIComponent(pathname);
  } catch (e) {
    res.writeHead(400);
    res.end('Bad Request');
    return;
  }

  // Build the full file path
  let filePath = path.join(ROOT, pathname);

  // If the path is a directory, serve index.html inside it
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // If still no extension, try adding .html
  if (!path.extname(filePath) && !fs.existsSync(filePath)) {
    filePath += '.html';
  }

  // Security: prevent path traversal outside ROOT
  const relative = path.relative(ROOT, filePath);
  if (relative.startsWith('..')) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // Read and serve the file
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // 404 — serve a nice error page
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <title>404 — Not Found</title>
            <style>
              body { font-family: system-ui, sans-serif; display:flex; align-items:center;
                     justify-content:center; min-height:100vh; margin:0; background:#0a0a0a; color:#e5e5e5; }
              .card { text-align:center; padding:3rem; }
              h1 { font-size:6rem; margin:0; opacity:.15; }
              p  { font-size:1.1rem; opacity:.6; margin:.5rem 0; }
              a  { color:#a78bfa; text-decoration:none; }
              a:hover { text-decoration:underline; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>404</h1>
              <p>Page not found: <code>${pathname}</code></p>
              <p><a href="/">Back to Home</a></p>
            </div>
          </body>
          </html>
        `);
      } else {
        res.writeHead(500);
        res.end('Internal Server Error');
      }
      return;
    }

    const headers = { 'Content-Type': getContentType(filePath) };
    const cacheControl = getCacheControl(filePath);
    if (cacheControl) headers['Cache-Control'] = cacheControl;
    res.writeHead(200, headers);
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('  WYRM.studios — Local Dev Server');
  console.log('  ---------------------------------');
  console.log('  Running at: http://localhost:' + PORT);
  console.log('');
  console.log('  Press Ctrl+C to stop.');
  console.log('');
});
