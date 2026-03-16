const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;
const DASHSCOPE_BASE = 'https://coding-intl.dashscope.aliyuncs.com/apps/anthropic';
const API_KEY = process.env.DASHSCOPE_API_KEY || 'sk-sp-c5a7314ae01540139711e064b45ef5ff';
// Map Anthropic model names to DashScope model names
const MODEL_MAP = {
  'claude-sonnet-4-6': 'qwen3.5-plus',
  'claude-sonnet-4-5-20250929': 'qwen3.5-plus',
  'claude-3-5-sonnet-20241022': 'qwen3.5-plus',
  'claude-3-sonnet-20240229': 'qwen3.5-plus',
  'claude-sonnet': 'qwen3.5-plus',
  'claude-3-sonnet': 'qwen3.5-plus',
  'claude-3-5-sonnet': 'qwen3.5-plus',
  'claude-opus': 'qwen-max',
  'claude-3-opus-20240229': 'qwen-max',
  'claude-haiku': 'qwen-turbo',
  'claude-3-haiku-20240307': 'qwen-turbo'
};

app.use(express.json({ limit: '50mb' }));
app.use(express.text({ limit: '50mb', type: '*/*' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Proxy all POST requests to DashScope
app.post('*', async (req, res) => {
  try {
    const targetPath = req.path;
    const url = `${DASHSCOPE_BASE}${targetPath}`;

    console.log(`Forwarding to: ${url}`);
    console.log(`Request body keys: ${Object.keys(req.body).join(', ')}`);

    // Translate model name if present
    const requestBody = { ...req.body };
    if (requestBody.model && MODEL_MAP[requestBody.model]) {
      console.log(`Model mapping: ${requestBody.model} -> ${MODEL_MAP[requestBody.model]}`);
      requestBody.model = MODEL_MAP[requestBody.model];
    }
    console.log(`Request body: ${JSON.stringify(requestBody).substring(0, 200)}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
        'anthropic-version': req.headers['anthropic-version'] || '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`DashScope response status: ${response.status}`);

    // Forward the response
    res.status(response.status);

    // Copy headers
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/event-stream')) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Stream SSE responses
      response.body.on('data', (chunk) => {
        res.write(chunk);
      });
      response.body.on('end', () => {
        res.end();
      });
    } else {
      const data = await response.json();
      res.json(data);
    }
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({
      error: {
        type: 'proxy_error',
        message: error.message
      }
    });
  }
});

// Handle GET requests (for health checks)
app.get('*', (req, res) => {
  res.json({ status: 'ok', path: req.path });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    dashscope_base: DASHSCOPE_BASE
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Anthropic Proxy Server running on port ${PORT}`);
  console.log(`Forwarding requests to: ${DASHSCOPE_BASE}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
