const axios = require('axios');

// Maps our bundle data sizes to megabytes for Hubnet
function toMegabytes(data) {
  const str = data.toLowerCase().trim();
  if (str.includes('gb')) return String(parseFloat(str) * 1000);
  if (str.includes('mb')) return String(parseFloat(str));
  return '1000';
}

// Maps our network names to Hubnet network codes
function toHubnetNetwork(network) {
  if (network === 'mtn') return 'mtn';
  if (network === 'telecel') return 'telecel';
  if (network === 'at') return 'at';
  return network;
}

async function deliverBundle({ bundleId, network, data, recipientPhone, orderReference }) {
  console.log(`[DELIVERY] Sending ${data} to ${recipientPhone} on ${network}`);

  if (!process.env.HUBNET_API_KEY) {
    console.log(`[DELIVERY] SIMULATED — ${data} sent to ${recipientPhone}`);
    return { success: true, simulated: true };
  }

  const hubnetNetwork = toHubnetNetwork(network);
  const volume = toMegabytes(data);
  const endpoint = `https://console.hubnet.app/live/api/context/business/transaction/${hubnetNetwork}-new-transaction`;

  try {
    const response = await axios.post(endpoint, {
      phone:     recipientPhone,
      volume,
      reference: orderReference.slice(0, 25),
      referrer:  recipientPhone,
      webhook:   `${process.env.BACKEND_URL}/api/webhook/hubnet`,
    }, {
      headers: {
        'token':        `Bearer ${process.env.HUBNET_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const result = response.data;
    console.log(`[DELIVERY] Hubnet response:`, result);

    if (result.message === '0000' || result.data?.code === '0000') {
      console.log(`[DELIVERY] ✓ Bundle delivered: ${data} → ${recipientPhone}`);
      return { success: true, transactionId: result.transaction_id, data: result };
    } else {
      throw new Error(result.reason || 'Delivery failed');
    }

  } catch (err) {
    console.error('[DELIVERY] ✗ Error:', err.response?.data || err.message);
    throw err;
  }
}

module.exports = { deliverBundle };