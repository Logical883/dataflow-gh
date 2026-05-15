const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const db = require('../db');

// ── POST /api/orders ──────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { bundleId, recipientPhone, payerEmail } = req.body;

  if (!bundleId || !recipientPhone || !payerEmail) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const bundle = db.getBundle(bundleId);
  if (!bundle) return res.status(404).json({ error: 'Bundle not found' });

  const reference = 'DF-' + uuidv4().slice(0, 10).toUpperCase();

  db.createOrder({
    reference,
    bundleId,
    bundle,
    recipientPhone,
    payerEmail,
    status:    'pending',
    createdAt: Date.now(),
  });

  try {
    console.log(`[ORDER] Bundle: ${bundle.price} | Pesewas: ${Math.round(bundle.price * 100)} | Ref: ${reference}`);

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email:        payerEmail,
        amount:       Math.round(bundle.price * 100),
        currency:     'GHS',
        reference,
        callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
        metadata: {
          bundleId,
          recipientPhone,
          data:        bundle.data,
          network:     bundle.network,
          bundlePrice: bundle.price,
        },
      },
      {
        headers: {
          Authorization:  `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({
      reference,
      checkoutUrl: response.data.data.authorization_url,
      bundlePrice: bundle.price,
    });

  } catch (err) {
    db.updateOrder(reference, { status: 'failed' });
    console.error('[PAYSTACK ERROR]', err.response?.data || err.message);
    res.status(502).json({ error: 'Payment initialization failed. Try again.' });
  }
});

// ── GET /api/orders ───────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  res.json({ orders: db.getAllOrders() });
});

// ── GET /api/orders/:reference ────────────────────────────────────────────────
router.get('/:reference', (req, res) => {
  const order = db.getOrder(req.params.reference);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ order });
});

module.exports = router;