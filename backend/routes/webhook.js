const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const db = require('../db');

// Send SMS via Paystack's SMS or any Ghana SMS provider
async function sendSMS(phone, message) {
  // Using Hubtel SMS API — sign up free at hubtel.com
  // Replace with your Hubtel credentials in .env
  if (!process.env.HUBTEL_CLIENT_ID || !process.env.HUBTEL_CLIENT_SECRET) {
    console.log(`[SMS SIMULATED] To: ${phone} | Message: ${message}`);
    return;
  }

  try {
    await axios.get('https://smsc.hubtel.com/v1/messages/send', {
      params: {
        clientsecret: process.env.HUBTEL_CLIENT_SECRET,
        clientid:     process.env.HUBTEL_CLIENT_ID,
        from:         'DataFlow',
        to:           phone,
        content:      message,
      },
    });
    console.log(`[SMS SENT] To: ${phone}`);
  } catch (err) {
    console.error('[SMS ERROR]', err.message);
  }
}

router.post('/paystack', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-paystack-signature'];
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(req.body)
    .digest('hex');

  if (hash !== signature) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  res.sendStatus(200);

  const event = JSON.parse(req.body);
  const { reference } = event.data || {};
  if (!reference) return;

  const order = db.getOrder(reference);
  if (!order) return;

  if (event.event === 'charge.success') {
    db.updateOrder(reference, { status: 'delivered', paidAt: Date.now() });
    console.log(`✓ Payment confirmed: ${reference}`);

    // Send SMS to recipient
    const smsMessage =
      `Hello! Your ${order.bundle.data} data bundle (valid for ${order.bundle.validity}) ` +
      `has been credited to ${order.recipientPhone}. ` +
      `Bundle expires in ${order.bundle.expiry}. ` +
      `Thank you for using DataFlow GH!`;

    await sendSMS(order.recipientPhone, smsMessage);

    // TODO: call your reseller API here to push the actual bundle
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