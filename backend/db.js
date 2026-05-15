const bundles = [
  { id: 'b1', network: 'telecel', data: '500MB', validity: '1 day',   price: 3  },
  { id: 'b2', network: 'telecel', data: '1GB',   validity: '3 days',  price: 5  },
  { id: 'b3', network: 'telecel', data: '2GB',   validity: '7 days',  price: 10 },
  { id: 'b4', network: 'telecel', data: '5GB',   validity: '30 days', price: 25 },
  { id: 'b5', network: 'mtn',     data: '1GB',   validity: '1 day',   price: 4  },
  { id: 'b6', network: 'mtn',     data: '3GB',   validity: '7 days',  price: 15 },
  { id: 'b7', network: 'mtn',     data: '6GB',   validity: '30 days', price: 30 },
  { id: 'b8', network: 'mtn',     data: '10GB',  validity: '30 days', price: 50 },
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