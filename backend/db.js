const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

console.log('[SUPABASE] Connected to:', process.env.SUPABASE_URL ? '✓ ' + process.env.SUPABASE_URL : '✗ missing URL');

module.exports = {
  // ── Bundles (Supabase) ────────────────────────────────────────────────────
  getBundles: async (network) => {
    let query = supabase.from('bundles').select('*').eq('status', 'active').order('network').order('price');
    if (network) query = query.eq('network', network);
    const { data, error } = await query;
    if (error) { console.error('[DB] getBundles error:', error.message); return []; }
    return data;
  },

  getBundle: async (id) => {
    const { data, error } = await supabase.from('bundles').select('*').eq('id', id).single();
    if (error) { console.error('[DB] getBundle error:', error.message); return null; }
    return data;
  },

  addBundle: async (bundle) => {
    const { data, error } = await supabase.from('bundles').insert({
      id:         bundle.id,
      network:    bundle.network,
      data:       bundle.data,
      validity:   bundle.validity || 'No expiry',
      price:      bundle.price,
      status:     'active',
      created_at: Date.now(),
    }).select().single();
    if (error) { console.error('[DB] addBundle error:', error.message); return null; }
    return data;
  },

  deleteBundle: async (id) => {
    const { error } = await supabase.from('bundles').update({ status: 'inactive' }).eq('id', id);
    if (error) { console.error('[DB] deleteBundle error:', error.message); return false; }
    return true;
  },

  // ── Orders (Supabase) ─────────────────────────────────────────────────────
  createOrder: async (order) => {
    const { error } = await supabase.from('orders').insert({
      reference:       order.reference,
      bundle_id:       order.bundleId,
      bundle:          order.bundle,
      recipient_phone: order.recipientPhone,
      payer_email:     order.payerEmail,
      paystack_fee:    order.paystackFee || 0,
      total_amount:    order.totalAmount || order.bundle?.price || 0,
      status:          order.status || 'pending',
      created_at:      order.createdAt || Date.now(),
    });
    if (error) console.error('[DB] createOrder error:', error.message);
    return order;
  },

  getOrder: async (reference) => {
    const { data, error } = await supabase
      .from('orders').select('*').eq('reference', reference).single();
    if (error) { console.error('[DB] getOrder error:', error.message); return null; }
    if (!data) return null;
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
    const mapped = { updated_at: Date.now() };
    if (updates.status)        mapped.status         = updates.status;
    if (updates.paidAt)        mapped.paid_at        = updates.paidAt;
    if (updates.delivery)      mapped.delivery       = updates.delivery;
    if (updates.deliveryError) mapped.delivery_error = updates.deliveryError;
    if (updates.failReason)    mapped.fail_reason    = updates.failReason;

    const { error } = await supabase.from('orders').update(mapped).eq('reference', reference);
    if (error) console.error('[DB] updateOrder error:', error.message);
  },

  getAllOrders: async () => {
    const { data, error } = await supabase
      .from('orders').select('*').order('created_at', { ascending: false });
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