const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

console.log('[SUPABASE] Connected to:', process.env.SUPABASE_URL ? '✓ ' + process.env.SUPABASE_URL : '✗ missing URL');

// ── Bundles (still in memory — bundles don't need to persist) ─────────────────
const bundles = [
  { id: 'b1',  network: 'mtn',     data: '1GB',   validity: 'No expiry', price: 6    },
  { id: 'b2',  network: 'mtn',     data: '2GB',   validity: 'No expiry', price: 11   },
  { id: 'b3',  network: 'mtn',     data: '3GB',   validity: 'No expiry', price: 15   },
  { id: 'b4',  network: 'mtn',     data: '4GB',   validity: 'No expiry', price: 20   },
  { id: 'b5',  network: 'mtn',     data: '5GB',   validity: 'No expiry', price: 25   },
  { id: 'b6',  network: 'mtn',     data: '6GB',   validity: 'No expiry', price: 29   },
  { id: 'b7',  network: 'mtn',     data: '8GB',   validity: 'No expiry', price: 38   },
  { id: 'b8',  network: 'mtn',     data: '10GB',  validity: 'No expiry', price: 46   },
  { id: 'b9',  network: 'mtn',     data: '15GB',  validity: 'No expiry', price: 68   },
  { id: 'b10', network: 'mtn',     data: '20GB',  validity: 'No expiry', price: 90   },
  { id: 'b11', network: 'mtn',     data: '25GB',  validity: 'No expiry', price: 113  },
  { id: 'b12', network: 'mtn',     data: '30GB',  validity: 'No expiry', price: 135  },
  { id: 'b13', network: 'mtn',     data: '40GB',  validity: 'No expiry', price: 178  },
  { id: 'b14', network: 'mtn',     data: '50GB',  validity: 'No expiry', price: 223  },
  { id: 'b15', network: 'mtn',     data: '100GB', validity: 'No expiry', price: 445  },
  { id: 'b16', network: 'telecel', data: '5GB',   validity: 'No expiry', price: 23   },
  { id: 'b17', network: 'telecel', data: '10GB',  validity: 'No expiry', price: 42   },
  { id: 'b18', network: 'telecel', data: '15GB',  validity: 'No expiry', price: 62   },
  { id: 'b19', network: 'telecel', data: '20GB',  validity: 'No expiry', price: 81   },
  { id: 'b20', network: 'telecel', data: '25GB',  validity: 'No expiry', price: 101  },
  { id: 'b21', network: 'telecel', data: '30GB',  validity: 'No expiry', price: 120  },
  { id: 'b22', network: 'telecel', data: '35GB',  validity: 'No expiry', price: 139  },
  { id: 'b23', network: 'telecel', data: '40GB',  validity: 'No expiry', price: 159  },
  { id: 'b24', network: 'telecel', data: '45GB',  validity: 'No expiry', price: 179  },
  { id: 'b25', network: 'telecel', data: '50GB',  validity: 'No expiry', price: 198  },
  { id: 'b26', network: 'telecel', data: '100GB', validity: 'No expiry', price: 392  },
];

module.exports = {
  // ── Bundles ──────────────────────────────────────────────────────────────
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

  // ── Orders (Supabase) ─────────────────────────────────────────────────────
  createOrder: async (order) => {
    const { error } = await supabase.from('orders').insert({
      reference:      order.reference,
      bundle_id:      order.bundleId,
      bundle:         order.bundle,
      recipient_phone: order.recipientPhone,
      payer_email:    order.payerEmail,
      paystack_fee:   order.paystackFee || 0,
      total_amount:   order.totalAmount || order.bundle?.price || 0,
      status:         order.status || 'pending',
      created_at:     order.createdAt || Date.now(),
    });
    if (error) console.error('[DB] createOrder error:', error.message);
    return order;
  },

  getOrder: async (reference) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('reference', reference)
      .single();
    if (error) { console.error('[DB] getOrder error:', error.message); return null; }
    if (!data) return null;
    // Map Supabase columns back to our order format
    return {
      reference:      data.reference,
      bundleId:       data.bundle_id,
      bundle:         data.bundle,
      recipientPhone: data.recipient_phone,
      payerEmail:     data.payer_email,
      paystackFee:    data.paystack_fee,
      totalAmount:    data.total_amount,
      status:         data.status,
      createdAt:      data.created_at,
      paidAt:         data.paid_at,
      delivery:       data.delivery,
      deliveryError:  data.delivery_error,
      failReason:     data.fail_reason,
    };
  },

  updateOrder: async (reference, updates) => {
    const mapped = {};
    if (updates.status)        mapped.status         = updates.status;
    if (updates.paidAt)        mapped.paid_at        = updates.paidAt;
    if (updates.delivery)      mapped.delivery       = updates.delivery;
    if (updates.deliveryError) mapped.delivery_error = updates.deliveryError;
    if (updates.failReason)    mapped.fail_reason    = updates.failReason;
    mapped.updated_at = Date.now();

    const { error } = await supabase
      .from('orders')
      .update(mapped)
      .eq('reference', reference);
    if (error) console.error('[DB] updateOrder error:', error.message);
  },

  getAllOrders: async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error('[DB] getAllOrders error:', error.message); return []; }
    return data.map(d => ({
      reference:      d.reference,
      bundleId:       d.bundle_id,
      bundle:         d.bundle,
      recipientPhone: d.recipient_phone,
      payerEmail:     d.payer_email,
      paystackFee:    d.paystack_fee,
      totalAmount:    d.total_amount,
      status:         d.status,
      createdAt:      d.created_at,
      paidAt:         d.paid_at,
      delivery:       d.delivery,
      deliveryError:  d.delivery_error,
      failReason:     d.fail_reason,
    }));
  },
};