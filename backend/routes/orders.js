const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const db = require('../db');

function calcPaystackFee(amountGHS) {
  const fee = (amountGHS * 0.015) + 0.50;
  return Math.min(parseFloat(fee.toFixed(2)), 2.00);
}

// POST /api/orders
router.post('/', async (req, res) => {
  const { bundleId, recipientPhone, payerEmail } = req.body;
  if (!bundleId || !recipientPhone || !payerEmail) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const bundle = await db.getBundle(bundleId);
  if (!bundle) return res.status(404).json({ error: 'Bundle not found' });

  const paystackFee = calcPaystackFee(bundle.price);
  const totalAmount = parseFloat((bundle.price + paystackFee).toFixed(2));
  const reference   = 'DF-' + uuidv4().slice(0, 10).toUpperCase();

  await db.createOrder({
    reference, bundleId, bundle,
    recipientPhone, payerEmail,
    paystackFee, totalAmount,
    status: 'pending', createdAt: Date.now(),
  });

  try {
    console.log(`[ORDER] Bundle: GH₵${bundle.price} | Fee: GH₵${paystackFee} | Total: GH₵${totalAmount}`);

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email:        payerEmail,
        amount:       Math.round(totalAmount * 100),
        currency:     'GHS',
        reference,
        callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
        metadata: {
          bundleId, recipientPhone,
          data:        bundle.data,
          network:     bundle.network,
          bundlePrice: bundle.price,
          paystackFee, totalAmount,
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
      paystackFee,
      totalAmount,
    });

  } catch (err) {
    await db.updateOrder(reference, { status: 'failed' });
    console.error('[PAYSTACK ERROR]', err.response?.data || err.message);
    res.status(502).json({ error: 'Payment initialization failed. Try again.' });
  }
});

// GET /api/orders
router.get('/', async (req, res) => {
  const orders = await db.getAllOrders();
  res.json({ orders });
});

// GET /api/orders/:reference
router.get('/:reference', async (req, res) => {
  const order = await db.getOrder(req.params.reference);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ order });
});

module.exports = router;