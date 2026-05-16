const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

function adminAuth(req, res, next) {
  const { username, password } = req.headers;
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
}

// GET /api/bundles
router.get('/', async (req, res) => {
  const bundles = await db.getBundles(req.query.network);
  res.json({ bundles });
});

// POST /api/bundles — admin only
router.post('/', adminAuth, async (req, res) => {
  const { network, data, validity, price } = req.body;
  if (!network || !data || !price) {
    return res.status(400).json({ error: 'network, data and price are required' });
  }
  const bundle = await db.addBundle({
    id:       'b' + uuidv4().slice(0, 6),
    network,
    data,
    validity: validity || 'No expiry',
    price:    Number(price),
  });
  res.status(201).json({ bundle });
});

// DELETE /api/bundles/:id — admin only
router.delete('/:id', adminAuth, async (req, res) => {
  const ok = await db.deleteBundle(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Bundle not found' });
  res.json({ success: true });
});

module.exports = router;