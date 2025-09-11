const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @route   POST /api/payments/create-order
// @desc    Create Razorpay order
// @access  Private
router.post('/create-order', auth, async (req, res) => {
  try {
    const { items, deliveryDetails, customerNotes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order items are required' });
    }

    // Validate and calculate total
    let totalAmount = 0;
    let vendorId = null;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.productId} not found` });
      }

      if (!product.isAvailable) {
        return res.status(400).json({ message: `Product ${product.name} is not available` });
      }

      // Ensure all items are from the same vendor
      if (vendorId === null) {
        vendorId = product.vendor;
      } else if (vendorId.toString() !== product.vendor.toString()) {
        return res.status(400).json({ message: 'All items must be from the same vendor' });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
        specialInstructions: item.specialInstructions || ''
      });
    }

    // Calculate delivery fee and taxes
    const deliveryFee = deliveryDetails?.type === 'delivery' ? 20 : 0; // ₹20 delivery fee
    const taxes = Math.round(totalAmount * 0.05); // 5% tax
    const finalAmount = totalAmount + deliveryFee + taxes;

    // Create order in database
    const order = new Order({
      customer: req.user._id,
      vendor: vendorId,
      items: orderItems,
      totalAmount,
      deliveryFee,
      taxes,
      finalAmount,
      paymentMethod: 'razorpay',
      deliveryDetails: {
        type: deliveryDetails?.type || 'pickup',
        address: deliveryDetails?.address || '',
        phone: deliveryDetails?.phone || req.user.phone,
        instructions: deliveryDetails?.instructions || ''
      },
      customerNotes: customerNotes || ''
    });

    await order.save();

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: finalAmount * 100, // Amount in paise
      currency: 'INR',
      receipt: order.orderNumber,
      notes: {
        orderId: order._id.toString(),
        customerId: req.user._id.toString(),
        vendorId: vendorId.toString()
      }
    });

    // Update order with Razorpay order ID
    order.paymentDetails.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.json({
      success: true,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        amount: finalAmount,
        currency: 'INR'
      },
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency
      },
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

// @route   POST /api/payments/verify
// @desc    Verify Razorpay payment
// @access  Private
router.post('/verify', auth, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId
    } = req.body;

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify the payment signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      // Payment verification failed
      order.paymentStatus = 'failed';
      order.status = 'cancelled';
      order.timeline.push({
        status: 'cancelled',
        timestamp: new Date(),
        note: 'Payment verification failed'
      });
      await order.save();

      return res.status(400).json({ 
        success: false, 
        message: 'Payment verification failed' 
      });
    }

    // Payment verified successfully
    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    order.paymentDetails.razorpayPaymentId = razorpay_payment_id;
    order.paymentDetails.razorpaySignature = razorpay_signature;
    order.timeline.push({
      status: 'confirmed',
      timestamp: new Date(),
      note: 'Payment successful and order confirmed'
    });

    await order.save();

    // Populate order details for response
    await order.populate([
      { path: 'customer', select: 'name email phone' },
      { path: 'vendor', select: 'name vendorDetails.businessName' },
      { path: 'items.product', select: 'name price images' }
    ]);

    res.json({
      success: true,
      message: 'Payment verified successfully',
      order
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: 'Payment verification failed' });
  }
});

// @route   POST /api/payments/webhook
// @desc    Handle Razorpay webhooks
// @access  Public (Razorpay)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body;

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const event = JSON.parse(body);
    
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity);
        break;
      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity);
        break;
      case 'order.paid':
        await handleOrderPaid(event.payload.order.entity);
        break;
      default:
        console.log('Unhandled webhook event:', event.event);
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

// Helper function to handle payment captured
const handlePaymentCaptured = async (payment) => {
  try {
    const order = await Order.findOne({
      'paymentDetails.razorpayOrderId': payment.order_id
    });

    if (order) {
      order.paymentStatus = 'paid';
      order.paymentDetails.razorpayPaymentId = payment.id;
      order.paymentDetails.transactionId = payment.id;
      
      if (order.status === 'pending') {
        order.status = 'confirmed';
        order.timeline.push({
          status: 'confirmed',
          timestamp: new Date(),
          note: 'Payment captured via webhook'
        });
      }
      
      await order.save();
    }
  } catch (error) {
    console.error('Handle payment captured error:', error);
  }
};

// Helper function to handle payment failed
const handlePaymentFailed = async (payment) => {
  try {
    const order = await Order.findOne({
      'paymentDetails.razorpayOrderId': payment.order_id
    });

    if (order) {
      order.paymentStatus = 'failed';
      order.status = 'cancelled';
      order.timeline.push({
        status: 'cancelled',
        timestamp: new Date(),
        note: 'Payment failed via webhook'
      });
      
      await order.save();
    }
  } catch (error) {
    console.error('Handle payment failed error:', error);
  }
};

// Helper function to handle order paid
const handleOrderPaid = async (razorpayOrder) => {
  try {
    const order = await Order.findOne({
      'paymentDetails.razorpayOrderId': razorpayOrder.id
    });

    if (order && order.paymentStatus !== 'paid') {
      order.paymentStatus = 'paid';
      
      if (order.status === 'pending') {
        order.status = 'confirmed';
        order.timeline.push({
          status: 'confirmed',
          timestamp: new Date(),
          note: 'Order paid via webhook'
        });
      }
      
      await order.save();
    }
  } catch (error) {
    console.error('Handle order paid error:', error);
  }
};

// @route   GET /api/payments/orders
// @desc    Get user's payment history
// @access  Private
router.get('/orders', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = { customer: req.user._id };
    if (status) {
      query.paymentStatus = status;
    }

    const orders = await Order.find(query)
      .populate('vendor', 'name vendorDetails.businessName')
      .populate('items.product', 'name price images')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalOrders = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: parseInt(page),
      totalOrders
    });
  } catch (error) {
    console.error('Get payment orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/payments/order/:id
// @desc    Get single order details
// @access  Private
router.get('/order/:id', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      $or: [
        { customer: req.user._id },
        { vendor: req.user._id }
      ]
    })
    .populate('customer', 'name email phone')
    .populate('vendor', 'name vendorDetails.businessName vendorDetails.location')
    .populate('items.product', 'name price images description');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/payments/refund
// @desc    Process refund (Admin only)
// @access  Private (Admin)
router.post('/refund', auth, async (req, res) => {
  try {
    const { orderId, amount, reason } = req.body;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({ message: 'Order payment is not in paid status' });
    }

    // Process refund with Razorpay
    const refund = await razorpay.payments.refund(
      order.paymentDetails.razorpayPaymentId,
      {
        amount: (amount || order.finalAmount) * 100, // Amount in paise
        notes: {
          reason: reason || 'Refund processed by admin',
          orderId: order._id.toString()
        }
      }
    );

    // Update order
    order.refundAmount = (amount || order.finalAmount);
    order.refundStatus = 'processed';
    order.status = 'cancelled';
    order.cancellationReason = reason || 'Refund processed by admin';
    order.timeline.push({
      status: 'refunded',
      timestamp: new Date(),
      note: `Refund of ₹${order.refundAmount} processed`
    });

    await order.save();

    res.json({
      success: true,
      message: 'Refund processed successfully',
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status
      }
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ message: 'Refund processing failed' });
  }
});

module.exports = router;