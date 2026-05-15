require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid username or password' });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'DataFlow GH backend is running' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes (we'll add these next)
const bundleRoutes = require('./routes/bundles');
const orderRoutes  = require('./routes/orders');
const webhookRoutes = require('./routes/webhook');

app.use('/api/bundles', bundleRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/webhook', webhookRoutes);

// Hubnet delivery webhook
app.post('/api/webhook/hubnet', (req, res) => {
  console.log('[HUBNET WEBHOOK]', req.body);
  const { reference, status } = req.body;
  if (reference && status) {
    const deliveryStatus = status === 'success' ? 'delivered' : 'delivery_failed';
    const db = require('./db');
    db.updateOrder(reference, { deliveryStatus, updatedAt: Date.now() });
  }
  res.sendStatus(200);
});

// Keep-alive ping every 1 minute
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;
setInterval(async () => {
  try {
    await axios.get(`${BACKEND_URL}/health`);
    console.log('[KEEP-ALIVE] Server pinged successfully');
  } catch (err) {
    console.error('[KEEP-ALIVE] Ping failed:', err.message);
  }
}, 60 * 1000);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Paystack key: ${process.env.PAYSTACK_SECRET_KEY ? '✓ loaded' : '✗ missing'}`);
});