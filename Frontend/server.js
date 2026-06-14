import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 80;

// The GATEWAY_HOSTPORT environment variable is injected by Render Blueprint
const gatewayHostPort = process.env.GATEWAY_HOSTPORT;
if (!gatewayHostPort) {
  console.warn("WARNING: GATEWAY_HOSTPORT is not set. Proxy will likely fail.");
}

const targetUrl = `http://${gatewayHostPort}`;
console.log(`Starting Node.js Proxy Server`);
console.log(`Targeting Gateway at: ${targetUrl}`);

// Proxy API requests
app.use('/api', createProxyMiddleware({
  target: targetUrl,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '', // remove /api prefix when forwarding
  },
  onProxyReq: (proxyReq, req, res) => {
    // Optionally log requests
    // console.log(`[Proxy] ${req.method} ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('[Proxy Error]', err);
    res.status(500).send('Proxy Error');
  }
}));

// Serve static React files
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback for React Router (Single Page Application)
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
