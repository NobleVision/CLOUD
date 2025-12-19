#!/usr/bin/env node
/**
 * CVS GCP Observability Frontend Server
 *
 * Serves the built frontend static files over HTTPS.
 * Proxies API requests and WebSocket connections to the backend server.
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import tls from 'tls';
import net from 'net';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = parseInt(process.env.PORT || '5443', 10);
const BACKEND_PORT = parseInt(process.env.BACKEND_PORT || '5442', 10);
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || '/opt/Scripts/Observability/certs/server.key';
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || '/opt/Scripts/Observability/certs/server.crt';
const STATIC_DIR = path.resolve(__dirname, '..', 'dist', 'public');

// MIME types for static files
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.map': 'application/json',
};

// Proxy API requests to backend
function proxyToBackend(req, res) {
  const options = {
    hostname: 'localhost',
    port: BACKEND_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `localhost:${BACKEND_PORT}` },
    rejectUnauthorized: false, // Allow self-signed certificates
  };

  const proxyReq = https.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('[Frontend] Proxy error:', err.message);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Backend service unavailable' }));
  });

  req.pipe(proxyReq);
}

// Security headers for all responses
const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

// Serve static files
function serveStatic(req, res) {
  let filePath = path.join(STATIC_DIR, req.url === '/' ? 'index.html' : req.url);
  
  // Remove query string
  filePath = filePath.split('?')[0];
  
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Serve index.html for client-side routing
        fs.readFile(path.join(STATIC_DIR, 'index.html'), (err2, indexContent) => {
          if (err2) {
            res.writeHead(404, { 'Content-Type': 'text/plain', ...SECURITY_HEADERS });
            res.end('Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html', ...SECURITY_HEADERS });
            res.end(indexContent);
          }
        });
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain', ...SECURITY_HEADERS });
        res.end('Internal Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': mimeType, ...SECURITY_HEADERS });
      res.end(content);
    }
  });
}

// Request handler
function handleRequest(req, res) {
  const url = req.url || '/';

  // Proxy API requests to backend
  if (url.startsWith('/api/')) {
    proxyToBackend(req, res);
    return;
  }

  // Serve static files
  serveStatic(req, res);
}

// Proxy WebSocket connections to backend
function proxyWebSocket(req, clientSocket, head) {
  const url = req.url || '/';

  // Only proxy WebSocket paths
  if (!url.startsWith('/ws/')) {
    clientSocket.destroy();
    return;
  }

  console.log('[Frontend] WebSocket upgrade request for:', url);

  // Create a TLS connection to the backend
  const backendSocket = tls.connect({
    host: 'localhost',
    port: BACKEND_PORT,
    rejectUnauthorized: false, // Allow self-signed certificates
  }, () => {
    console.log('[Frontend] Connected to backend WebSocket server');

    // Send the upgrade request to the backend
    const upgradeRequest = [
      `GET ${url} HTTP/1.1`,
      `Host: localhost:${BACKEND_PORT}`,
      `Upgrade: websocket`,
      `Connection: Upgrade`,
      `Sec-WebSocket-Key: ${req.headers['sec-websocket-key']}`,
      `Sec-WebSocket-Version: ${req.headers['sec-websocket-version']}`,
    ];

    // Add optional headers
    if (req.headers['sec-websocket-protocol']) {
      upgradeRequest.push(`Sec-WebSocket-Protocol: ${req.headers['sec-websocket-protocol']}`);
    }
    if (req.headers['sec-websocket-extensions']) {
      upgradeRequest.push(`Sec-WebSocket-Extensions: ${req.headers['sec-websocket-extensions']}`);
    }

    upgradeRequest.push('', '');
    backendSocket.write(upgradeRequest.join('\r\n'));

    // Forward initial data if present
    if (head && head.length > 0) {
      backendSocket.write(head);
    }
  });

  // Pipe data between client and backend
  backendSocket.on('data', (data) => {
    if (clientSocket.writable) {
      clientSocket.write(data);
    }
  });

  clientSocket.on('data', (data) => {
    if (backendSocket.writable) {
      backendSocket.write(data);
    }
  });

  // Handle connection close
  backendSocket.on('close', () => {
    console.log('[Frontend] Backend WebSocket closed');
    clientSocket.destroy();
  });

  clientSocket.on('close', () => {
    console.log('[Frontend] Client WebSocket closed');
    backendSocket.destroy();
  });

  // Handle errors
  backendSocket.on('error', (err) => {
    console.error('[Frontend] Backend WebSocket error:', err.message);
    clientSocket.destroy();
  });

  clientSocket.on('error', (err) => {
    console.error('[Frontend] Client WebSocket error:', err.message);
    backendSocket.destroy();
  });
}

// Start server
function startServer() {
  // Check for SSL certificates
  if (!fs.existsSync(SSL_KEY_PATH) || !fs.existsSync(SSL_CERT_PATH)) {
    console.error('[Frontend] SSL certificates not found');
    console.log('[Frontend] Expected key:', SSL_KEY_PATH);
    console.log('[Frontend] Expected cert:', SSL_CERT_PATH);
    process.exit(1);
  }

  // Check for static directory
  if (!fs.existsSync(STATIC_DIR)) {
    console.error('[Frontend] Static directory not found:', STATIC_DIR);
    console.log('[Frontend] Run "pnpm build" to generate static files');
    process.exit(1);
  }

  const httpsOptions = {
    key: fs.readFileSync(SSL_KEY_PATH),
    cert: fs.readFileSync(SSL_CERT_PATH),
  };

  const server = https.createServer(httpsOptions, handleRequest);

  // Handle WebSocket upgrade requests
  server.on('upgrade', proxyWebSocket);

  server.listen(PORT, () => {
    console.log(`[Frontend] CVS GCP Observability Dashboard`);
    console.log(`[Frontend] Running on https://localhost:${PORT}/`);
    console.log(`[Frontend] Backend proxy: https://localhost:${BACKEND_PORT}/`);
    console.log(`[Frontend] WebSocket proxy: wss://localhost:${BACKEND_PORT}/ws/metrics`);
    console.log(`[Frontend] Static files: ${STATIC_DIR}`);
  });
}

startServer();
