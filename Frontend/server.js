import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 80;

// The GATEWAY_URL environment variable is injected by Render Blueprint.
// It's the gateway's public RENDER_EXTERNAL_URL (e.g. https://aks-gateway-xxxx.onrender.com),
// since Free-plan services can't talk to each other over the private network.
const gatewayUrl = process.env.GATEWAY_URL;
if (!gatewayUrl) {
  console.warn("WARNING: GATEWAY_URL is not set. Proxy will likely fail.");
}

// Support both a full URL (https://...) and a bare host:port for local/dev use.
const targetUrl = gatewayUrl && gatewayUrl.startsWith('http')
  ? gatewayUrl
  : `http://${gatewayUrl}`;
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
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});