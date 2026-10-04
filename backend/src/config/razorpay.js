const Razorpay = require('razorpay');

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_samplekey123',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'sample_secret_key_123',
});

module.exports = razorpayInstance;
