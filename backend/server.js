require('dotenv').config();
const express = require('express');
const cors = require('cors');

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

// Routes (we'll add these next)
const bundleRoutes = require('./routes/bundles');
const orderRoutes  = require('./routes/orders');
const webhookRoutes = require('./routes/webhook');

app.use('/api/bundles', bundleRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/webhook', webhookRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Paystack key: ${process.env.PAYSTACK_SECRET_KEY ? '✓ loaded' : '✗ missing'}`);
});