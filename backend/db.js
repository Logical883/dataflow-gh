const bundles = [
  // ── MTN MTNUP2U ──────────────────────────────────────────────────────────
  { id: 'b1',  network: 'mtn', data: '1GB',  validity: 'No expiry', price: 6,   hubnetCost: 4.20  },
  { id: 'b2',  network: 'mtn', data: '2GB',  validity: 'No expiry', price: 11,  hubnetCost: 8.00  },
  { id: 'b3',  network: 'mtn', data: '3GB',  validity: 'No expiry', price: 15,  hubnetCost: 12.00 },
  { id: 'b4',  network: 'mtn', data: '4GB',  validity: 'No expiry', price: 20,  hubnetCost: 16.00 },
  { id: 'b5',  network: 'mtn', data: '5GB',  validity: 'No expiry', price: 25,  hubnetCost: 20.00 },
  { id: 'b6',  network: 'mtn', data: '6GB',  validity: 'No expiry', price: 29,  hubnetCost: 24.00 },
  { id: 'b7',  network: 'mtn', data: '8GB',  validity: 'No expiry', price: 38,  hubnetCost: 32.00 },
  { id: 'b8',  network: 'mtn', data: '10GB', validity: 'No expiry', price: 46,  hubnetCost: 38.50 },

  // ── TELECEL ───────────────────────────────────────────────────────────────
  { id: 'b9',  network: 'telecel', data: '5GB',  validity: 'No expiry', price: 23,  hubnetCost: 18.00  },
  { id: 'b10', network: 'telecel', data: '10GB', validity: 'No expiry', price: 40,  hubnetCost: 34.50  },
  { id: 'b11', network: 'telecel', data: '15GB', validity: 'No expiry', price: 60,  hubnetCost: 51.00  },
  { id: 'b12', network: 'telecel', data: '20GB', validity: 'No expiry', price: 78,  hubnetCost: 67.50  },
];

const orders = {};

module.exports = {
  getBundles: (network) =>
    bundles.filter(b => !network || b.network === network),

  getBundle: (id) => bundles.find(b => b.id === id),

  addBundle: (bundle) => { bundles.push(bundle); return bundle; },

  deleteBundle: (id) => {
    const idx = bundles.findIndex(b => b.id === id);
    if (idx === -1) return false;
    bundles.splice(idx, 1);
    return true;
  },

  createOrder: (order) => { orders[order.reference] = order; return order; },

  getOrder: (ref) => orders[ref],

  updateOrder: (ref, updates) => {
    if (!orders[ref]) return null;
    Object.assign(orders[ref], updates);
    return orders[ref];
  },

  getAllOrders: () =>
    Object.values(orders).sort((a, b) => b.createdAt - a.createdAt),
};