const Razorpay = require('razorpay');

const getKeyId = () => {
  const k = process.env.RAZORPAY_KEY_ID;
  if (!k || k === 'rzp_test_samplekey123' || k.includes('sample')) {
    return 'rzp_test_Tke9phN5CHp5pQ';
  }
  return k.trim();
};

const getKeySecret = () => {
  const s = process.env.RAZORPAY_KEY_SECRET;
  if (!s || s === 'sample_secret' || s.includes('sample')) {
    return 'YwtAP0tLreKJ3t8q2YPV8h2z';
  }
  return s.trim();
};

const razorpayInstance = new Razorpay({
  key_id: getKeyId(),
  key_secret: getKeySecret(),
});

module.exports = razorpayInstance;
module.exports.getKeyId = getKeyId;
module.exports.getKeySecret = getKeySecret;
