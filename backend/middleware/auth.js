const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Check if user is admin
const adminAuth = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Check if user is vendor
const vendorAuth = async (req, res, next) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ message: 'Access denied. Vendor privileges required.' });
    }
    
    if (!req.user.vendorDetails?.isApproved) {
      return res.status(403).json({ message: 'Vendor account not approved yet.' });
    }
    
    next();
  } catch (error) {
    console.error('Vendor auth error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Check if user is student
const studentAuth = async (req, res, next) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied. Student privileges required.' });
    }
    next();
  } catch (error) {
    console.error('Student auth error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Check if user is vendor or admin
const vendorOrAdminAuth = async (req, res, next) => {
  try {
    if (req.user.role !== 'vendor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Vendor or Admin privileges required.' });
    }
    
    if (req.user.role === 'vendor' && !req.user.vendorDetails?.isApproved) {
      return res.status(403).json({ message: 'Vendor account not approved yet.' });
    }
    
    next();
  } catch (error) {
    console.error('Vendor or admin auth error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  auth,
  adminAuth,
  vendorAuth,
  studentAuth,
  vendorOrAdminAuth
};