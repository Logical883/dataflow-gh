const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const db = require('../db');

// ── Calculate Paystack fee to pass to customer ────────────────────────────────
// Paystack charges 1.5% + GH₵ 0.50, capped at GH₵ 2.00
function calcPaystackFee(amountGHS) {
  const fee = (amountGHS * 0.015) + 0.50;
  return Math.min(parseFloat(fee.toFixed(2)), 2.00);
}

// ── POST /api/orders ──────────────────────────────────────────────────────────
// Customer initiates a purchase — creates order and returns Paystack checkout URL
router.post('/', async (req, res) => {
  const { bundleId, recipientPhone, payerEmail } = req.body;

  if (!bundleId || !recipientPhone || !payerEmail) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const bundle = db.getBundle(bundleId);
  if (!bundle) return res.status(404).json({ error: 'Bundle not found' });

  const paystackFee = calcPaystackFee(bundle.price);
  const totalAmount = parseFloat((bundle.price + paystackFee).toFixed(2));
  const reference   = 'DF-' + uuidv4().slice(0, 10).toUpperCase();

  // Save order as pending
  db.createOrder({
    reference,
    bundleId,
    bundle,
    recipientPhone,
    payerEmail,
    paystackFee,
    totalAmount,
    status:    'pending',
    createdAt: Date.now(),
  });

  try {
    console.log(`[ORDER] Bundle: ${bundle.price} | Fee: ${paystackFee} | Total: ${totalAmount} | Pesewas: ${Math.round(totalAmount * 100)}`);
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email:        payerEmail,
        amount:       Math.round(totalAmount * 100), // in pesewas
        currency:     'GHS',
        reference,
        callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
        metadata: {
          bundleId,
          recipientPhone,
          data:        bundle.data,
          network:     bundle.network,
          bundlePrice: bundle.price,
          paystackFee,
          totalAmount,
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
      checkoutUrl:  response.data.data.authorization_url,
      bundlePrice:  bundle.price,
      paystackFee,
      totalAmount,
    });

  } catch (err) {
    db.updateOrder(reference, { status: 'failed' });
    console.error('[PAYSTACK ERROR]', err.response?.data || err.message);
    res.status(502).json({ error: 'Payment initialization failed. Try again.' });
  }
});

// ── GET /api/orders ───────────────────────────────────────────────────────────
// Admin: list all orders
router.get('/', (req, res) => {
  res.json({ orders: db.getAllOrders() });
});

// ── GET /api/orders/:reference ────────────────────────────────────────────────
// Poll a single order status (used by frontend callback page)
router.get('/:reference', (req, res) => {
  const order = db.getOrder(req.params.reference);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ order });
});

module.exports = router;