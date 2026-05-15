const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

// GET /api/bundles — public, no auth needed
router.get('/', (req, res) => {
  const bundles = db.getBundles(req.query.network);
  res.json({ bundles });
});

// Admin auth middleware
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

// POST /api/bundles — admin only
router.post('/', adminAuth, (req, res) => {
  const { network, data, validity, price } = req.body;
  if (!network || !data || !validity || !price) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  const bundle = db.addBundle({
    id: 'b' + uuidv4().slice(0, 6),
    network,
    data,
    validity,
    price: Number(price),
  });
  res.status(201).json({ bundle });
});

// DELETE /api/bundles/:id — admin only
router.delete('/:id', adminAuth, (req, res) => {
  const ok = db.deleteBundle(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Bundle not found' });
  res.json({ success: true });
});

module.exports = router;