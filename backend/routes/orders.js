const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const db = require('../db');

function adminAuth(req, res, next) {
  const { username, password } = req.headers;
  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
}

function calcPaystackFee(amountGHS) {
  const fee = (amountGHS * 0.015) + 0.50;
  return Math.min(parseFloat(fee.toFixed(2)), 2.00);
}

// POST /api/orders
router.post('/', async (req, res) => {
  const { bundleId, recipientPhone, payerEmail } = req.body;
  if (!bundleId || !recipientPhone) {
    return res.status(400).json({ error: 'Bundle and recipient number are required' });
  }

  const bundle = await db.getBundle(bundleId);
  if (!bundle) return res.status(404).json({ error: 'Bundle not found' });

  // Validate phone number matches network
const mtnPrefixes     = ["024", "054", "055", "059", "053", "025"];
const telecelPrefixes = ["020", "050"];
const cleanedPhone    = recipientPhone.replace(/[\s\-\(\)]/g, '');
const prefix          = cleanedPhone.slice(0, 3);
const isMTN           = mtnPrefixes.includes(prefix);
const isTelecel       = telecelPrefixes.includes(prefix);

if (bundle.network === "mtn" && !isMTN) {
  return res.status(400).json({ error: `This appears to be a non-MTN number. Please enter an MTN number (024, 054, 055, 059, 053, 025).` });
}
if (bundle.network === "telecel" && !isTelecel) {
  return res.status(400).json({ error: `This appears to be a non-Telecel number. Please enter a Telecel number (020, 050).` });
}

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
        email: payerEmail || 'yeboahalbert577@gmail.com',
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

// GET /api/orders — admin only
router.get('/', adminAuth, async (req, res) => {
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

