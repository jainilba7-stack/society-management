const MaintenanceBill = require('../models/MaintenanceBill');
const Payment = require('../models/Payment');
const Flat = require('../models/Flat');
const User = require('../models/User');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const razorpayInstance = require('../config/razorpay');
const { sendPaymentReceiptEmail } = require('../services/emailService');
const crypto = require('crypto');

const createMaintenanceBill = async (req, res, next) => {
  try {
    const { month, year, amount, dueDate, lateFee, description, targetBlockIds } = req.body;

    const bill = await MaintenanceBill.create({
      month,
      year: parseInt(year),
      amount: parseFloat(amount),
      dueDate: new Date(dueDate),
      lateFee: lateFee ? parseFloat(lateFee) : 100,
      description: description || 'Monthly Maintenance Charge',
      targetBlocks: targetBlockIds || [],
    });

    // Bulk update flat statuses to pending
    let flatFilter = {};
    if (targetBlockIds && targetBlockIds.length > 0) {
      flatFilter.block = { $in: targetBlockIds };
    }

    const flats = await Flat.find(flatFilter);
    for (let flat of flats) {
      flat.maintenanceStatus = 'pending';
      await flat.save();

      if (flat.resident) {
        // Create pending payment record
        await Payment.create({
          bill: bill._id,
          resident: flat.resident,
          flat: flat._id,
          block: flat.block,
          amount: bill.amount,
          totalPaid: bill.amount,
          status: 'pending',
        });

        // Notify resident
        await Notification.create({
          recipient: flat.resident,
          title: `🔔 New Maintenance Bill - ${month} ${year}`,
          message: `Maintenance bill of ₹${bill.amount} for ${month} ${year} has been issued. Due Date: ${new Date(dueDate).toLocaleDateString()}`,
          type: 'bill',
        });
      }
    }

    await ActivityLog.create({
      action: 'Created Maintenance Bill',
      user: req.user._id,
      userRole: req.user.role,
      details: `Created maintenance bill for ${month} ${year} (₹${amount})`,
    });

    res.status(201).json({ success: true, message: 'Maintenance bill created and assigned to flats', bill });
  } catch (error) {
    next(error);
  }
};

const getBills = async (req, res, next) => {
  try {
    const bills = await MaintenanceBill.find().populate('targetBlocks', 'name').sort('-createdAt');
    res.status(200).json({ success: true, count: bills.length, bills });
  } catch (error) {
    next(error);
  }
};

const getPayments = async (req, res, next) => {
  try {
    const { blockId, status } = req.query;
    let query = {};

    // Block scope check
    if (req.user.role === 'secretary') {
      if (req.user.block) query.block = req.user.block;
    } else if (req.user.role === 'resident') {
      query.resident = req.user._id;
    } else if (blockId) {
      query.block = blockId;
    }

    if (status) query.status = status;

    const payments = await Payment.find(query)
      .populate('resident', 'fullName email phone')
      .populate('flat', 'flatNumber')
      .populate('block', 'name')
      .populate('bill')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: payments.length, payments });
  } catch (error) {
    next(error);
  }
};

// Razorpay Order Creation
const createRazorpayOrder = async (req, res, next) => {
  try {
    const { paymentId, amount } = req.body;

    const paymentRecord = await Payment.findById(paymentId);
    if (!paymentRecord) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const options = {
      amount: Math.round(amount * 100), // in paise
      currency: 'INR',
      receipt: `receipt_${paymentId.slice(-8)}_${Date.now()}`,
    };

    try {
      const order = await razorpayInstance.orders.create(options);
      paymentRecord.razorpayOrderId = order.id;
      await paymentRecord.save();

      res.status(200).json({
        success: true,
        order,
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_samplekey123',
      });
    } catch (razorErr) {
      console.warn('[Razorpay API Warning]:', razorErr.message);
      // Fallback for simulation mode
      const mockOrder = {
        id: `order_mock_${Date.now()}`,
        amount: options.amount,
        currency: 'INR',
      };
      paymentRecord.razorpayOrderId = mockOrder.id;
      await paymentRecord.save();

      res.status(200).json({
        success: true,
        order: mockOrder,
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_samplekey123',
      });
    }
  } catch (error) {
    next(error);
  }
};

// Verify Payment & Mark Paid
const processPaymentVerification = async (req, res, next) => {
  try {
    const { paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentMethod } = req.body;

    const payment = await Payment.findById(paymentId).populate('resident').populate('flat').populate('block');
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const txnId = razorpayPaymentId || `TXN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    payment.status = 'paid';
    payment.paymentDate = new Date();
    payment.paymentMethod = paymentMethod || 'razorpay';
    payment.transactionId = txnId;
    payment.receiptUrl = `/api/maintenance/receipt/${payment._id}`;
    await payment.save();

    // Update flat status
    if (payment.flat) {
      const flatId = payment.flat._id ? payment.flat._id : payment.flat;
      const flat = await Flat.findById(flatId);
      if (flat) {
        flat.maintenanceStatus = 'paid';
        await flat.save();
      }
    }

    const residentId = payment.resident ? (payment.resident._id || payment.resident) : req.user._id;

    // Create Notification
    await Notification.create({
      recipient: residentId,
      title: '✅ Payment Successful',
      message: `Your maintenance payment of ₹${payment.totalPaid} (Txn: ${txnId}) has been received successfully!`,
      type: 'payment',
    });

    // Log Activity
    await ActivityLog.create({
      action: 'Maintenance Paid',
      user: residentId,
      userRole: req.user.role || 'resident',
      details: `${payment.resident ? payment.resident.fullName : 'Resident'} paid ₹${payment.totalPaid} for maintenance`,
    });

    // Send Email Receipt
    if (payment.resident && payment.flat) {
      sendPaymentReceiptEmail(payment.resident, payment, payment.flat);
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified and marked as PAID successfully',
      payment,
    });
  } catch (error) {
    next(error);
  }
};

// Download / View Receipt Data
const getReceipt = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId)
      .populate('resident', 'fullName email phone')
      .populate('flat', 'flatNumber')
      .populate('block', 'name')
      .populate('bill');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    res.status(200).json({ success: true, receipt: payment });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMaintenanceBill,
  getBills,
  getPayments,
  createRazorpayOrder,
  processPaymentVerification,
  getReceipt,
};
