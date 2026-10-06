const Razorpay = require('razorpay');

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_Tke9phN5CHp5pQ',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'YwtAP0tLreKJ3t8q2YPV8h2z',
});

module.exports = razorpayInstance;
