const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const db = require('../db');
const { deliverBundle } = require('../bundleDelivery');

router.post('/paystack', express.raw({ type: '*/*' }), async (req, res) => {
  const signature = req.headers['x-paystack-signature'];

  // Convert body to string properly
  const rawBody = Buffer.isBuffer(req.body)
    ? req.body.toString('utf8')
    : typeof req.body === 'string'
      ? req.body
      : JSON.stringify(req.body);

  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest('hex');

  if (hash !== signature) {
    console.log('[WEBHOOK] Invalid signature');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Respond immediately so Paystack doesn't retry
  res.sendStatus(200);

  const event = JSON.parse(rawBody);
  console.log('[WEBHOOK] Event received:', event.event, event.data?.reference);

  const { reference } = event.data || {};
  if (!reference) return;

  const order = db.getOrder(reference);
  if (!order) {
    console.warn('[WEBHOOK] Unknown reference:', reference);
    return;
  }

  if (event.event === 'charge.success') {
    db.updateOrder(reference, { status: 'paid', paidAt: Date.now() });
    console.log('[WEBHOOK] ✓ Payment confirmed:', reference);

    try {
      const result = await deliverBundle({
        bundleId:       order.bundleId,
        network:        order.bundle.network,
        data:           order.bundle.data,
        recipientPhone: order.recipientPhone,
        orderReference: reference,
      });

      db.updateOrder(reference, {
        status:    'delivered',
        delivery:  result,
        updatedAt: Date.now(),
      });
      console.log('[DELIVERY] ✓ Bundle delivered for', reference);

    } catch (err) {
      db.updateOrder(reference, {
        status:        'delivery_failed',
        deliveryError: err.message,
        updatedAt:     Date.now(),
      });
      console.error('[DELIVERY] ✗ Failed for', reference, ':', err.message);
    }
  }

  if (event.event === 'charge.failed') {
    db.updateOrder(reference, {
      status:     'failed',
      failReason: event.data.gateway_response,
      updatedAt:  Date.now(),
    });
    console.log('[WEBHOOK] ✗ Payment failed:', reference);
  }
});

module.exports = router;