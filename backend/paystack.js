const axios = require('axios');

const NETWORK_MAP = { mtn: 'mtn', telecel: 'vod' };

async function initiateCharge({ email, amountGHS, phone, network, reference, metadata }) {
  const provider = NETWORK_MAP[network];
  if (!provider) throw new Error(`Unknown network: ${network}`);

  const response = await axios.post('https://api.paystack.co/charge', {
    email,
    amount: Math.round(amountGHS * 100), // convert to pesewas
    currency: 'GHS',
    mobile_money: { phone, provider },
    reference,
    metadata,
  }, {
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  return response.data;
}

module.exports = { initiateCharge };