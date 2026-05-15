const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { initiateCharge } = require('../paystack');

// POST /api/orders  — customer buys a bundle
router.post('/', async (req, res) => {
  const { bundleId, recipientPhone, payerPhone, payerEmail } = req.body;

  if (!bundleId || !recipientPhone || !payerPhone || !payerEmail) {
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
    payerPhone,
    payerEmail,
    status: 'pending',
    createdAt: Date.now(),
  });

  try {
    const charge = await initiateCharge({
      email:     payerEmail,
      amountGHS: bundle.price,
      phone:     payerPhone,
      network:   bundle.network,
      reference,
      metadata:  { bundleId, recipientPhone, data: bundle.data },
    });

    res.json({
      reference,
      status: 'pending',
      message: 'Check your phone and enter your PIN to complete payment.',
      paystack: charge.data,
    });

  } catch (err) {
    db.updateOrder(reference, { status: 'failed' });
    console.error(err.response?.data || err.message);
    res.status(502).json({ error: 'Payment initiation failed. Try again.' });
  }
});

// GET /api/orders  — list all orders (admin)
router.get('/', (req, res) => {
  res.json({ orders: db.getAllOrders() });
});

// GET /api/orders/:reference  — poll a single order status
router.get('/:reference', (req, res) => {
  const order = db.getOrder(req.params.reference);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ order });
});

module.exports = router;