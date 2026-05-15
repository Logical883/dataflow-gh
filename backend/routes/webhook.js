const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');

router.post('/paystack', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-paystack-signature'];
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(req.body)
    .digest('hex');

  if (hash !== signature) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Respond immediately so Paystack doesn't retry
  res.sendStatus(200);

  const event = JSON.parse(req.body);
  const { reference } = event.data || {};
  if (!reference) return;

  const order = db.getOrder(reference);
  if (!order) return;

  if (event.event === 'charge.success') {
    db.updateOrder(reference, { status: 'delivered', paidAt: Date.now() });
    console.log(`✓ Payment confirmed and bundle delivered: ${reference}`);
    // TODO: call your reseller API here to actually push the bundle
  }

  if (event.event === 'charge.failed') {
    db.updateOrder(reference, {
      status: 'failed',
      failReason: event.data.gateway_response,
    });
    console.log(`✗ Payment failed: ${reference}`);
  }
});

module.exports = router;