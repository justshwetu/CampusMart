const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { auth } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const { generateOtp, hashOtp, verifyOtpHash, canSendAgain, sendOtpEmail } = require('../services/otp');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, college, studentId, vendorDetails } = req.body;

    // Check if user already exists with email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Check if student ID already exists (for student registration)
    if (role === 'student' && studentId) {
      const existingStudent = await User.findOne({ studentId });
      if (existingStudent) {
        return res.status(400).json({ message: 'Student ID already exists. Please use a different Student ID.' });
      }
    }

    // Validate required fields based on role
    if (role === 'student' && !studentId) {
      return res.status(400).json({ message: 'Student ID is required for student registration' });
    }

    if (role === 'vendor' && (!vendorDetails || !vendorDetails.businessName)) {
      return res.status(400).json({ message: 'Business details are required for vendor registration' });
    }

    // Create new user
    const userData = {
      name,
      email,
      password,
      role: role || 'student',
      phone,
      college
    };

    if (role === 'student') {
      userData.studentId = studentId;
    }

    if (role === 'vendor') {
      userData.vendorDetails = {
        businessName: vendorDetails.businessName,
        businessType: vendorDetails.businessType,
        location: vendorDetails.location,
        isApproved: false
      };
    }

    const user = new User(userData);
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        college: user.college,
        vendorDetails: user.vendorDetails
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      // Duplicate key error
      if (error.keyPattern && error.keyPattern.email) {
        return res.status(400).json({ message: 'Email already exists. Please use a different email address.' });
      }
      if (error.keyPattern && error.keyPattern.studentId) {
        return res.status(400).json({ message: 'Student ID already exists. Please use a different Student ID.' });
      }
      return res.status(400).json({ message: 'Duplicate information detected. Please check your details.' });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    // Generic server error
    res.status(500).json({ message: 'Server error during registration. Please try again.' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required for login' });
    }

    // Check if user exists and is active
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'No account found for this email' });
    }

    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated. Please contact admin.' });
    }

    // Verify password first
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // For admin and vendor roles, bypass OTP and issue token directly
    if (user.role === 'admin' || user.role === 'vendor') {
      user.lastLogin = new Date();
      await user.save();

      const token = generateToken(user._id);
      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          college: user.college,
          vendorDetails: user.vendorDetails,
          profileImage: user.profileImage
        }
      });
    }

    // After correct password, send OTP and require verification before issuing token
    if (!canSendAgain(user.otpLastSentAt)) {
      const cooldownMs = 60 * 1000;
      const resendAvailableAt = new Date(new Date(user.otpLastSentAt).getTime() + cooldownMs);
      return res.status(429).json({ 
        message: 'Please wait before requesting another code', 
        otpRequired: true, 
        email: user.email,
        resendAvailableAt
      });
    }

    const { code, expiresAt } = generateOtp();
    user.otpCodeHash = await hashOtp(code);
    user.otpExpiresAt = expiresAt;
    user.otpLastSentAt = new Date();
    await user.save();

    try {
      const sendRes = await sendOtpEmail(user.email, code);
      const devFallback = !!(sendRes && sendRes.fallbackLogged);
      const cooldownMs = 60 * 1000;
      const resendAvailableAt = new Date(new Date(user.otpLastSentAt).getTime() + cooldownMs);
      return res.json({
        message: 'Verification code sent to your email',
        otpRequired: true,
        email: user.email,
        devFallback,
        expiresInMinutes: 10,
        otpExpiresAt: user.otpExpiresAt,
        resendAvailableAt
      });
    } catch (e) {
      console.error('Failed to send OTP email:', e?.message || e);
      // Dev fallback: log OTP code for testing when email delivery fails
      console.log(`DEV Fallback OTP for ${user.email}: ${code}`);
      const cooldownMs = 60 * 1000;
      const resendAvailableAt = new Date(new Date(user.otpLastSentAt).getTime() + cooldownMs);
      return res.json({
        message: 'Verification code attempted to send',
        otpRequired: true,
        email: user.email,
        devFallback: true,
        expiresInMinutes: 10,
        otpExpiresAt: user.otpExpiresAt,
        resendAvailableAt
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   POST /api/auth/request-otp
// @desc    Request a one-time login code via email
// @access  Public
router.post('/request-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'No account found for this email' });
    }

    if (!canSendAgain(user.otpLastSentAt)) {
      const cooldownMs = 60 * 1000;
      const resendAvailableAt = new Date(new Date(user.otpLastSentAt).getTime() + cooldownMs);
      return res.status(429).json({ message: 'Please wait before requesting another code', resendAvailableAt });
    }

    const { code, expiresAt } = generateOtp();
    user.otpCodeHash = await hashOtp(code);
    user.otpExpiresAt = expiresAt;
    user.otpLastSentAt = new Date();
    await user.save();

    try {
      const sendRes = await sendOtpEmail(user.email, code);
      const devFallback = !!(sendRes && sendRes.fallbackLogged);
      const cooldownMs = 60 * 1000;
      const resendAvailableAt = new Date(new Date(user.otpLastSentAt).getTime() + cooldownMs);
      return res.json({ 
        message: 'Verification code sent to your email',
        devFallback,
        expiresInMinutes: 10,
        otpExpiresAt: user.otpExpiresAt,
        resendAvailableAt
      });
    } catch (e) {
      console.error('Failed to send OTP email:', e?.message || e);
      // Dev fallback: log OTP code for testing when email delivery fails
      console.log(`DEV Fallback OTP for ${user.email}: ${code}`);
      const cooldownMs = 60 * 1000;
      const resendAvailableAt = new Date(new Date(user.otpLastSentAt).getTime() + cooldownMs);
      return res.json({ 
        message: 'Verification code attempted to send',
        devFallback: true,
        expiresInMinutes: 10,
        otpExpiresAt: user.otpExpiresAt,
        resendAvailableAt
      });
    }
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({ message: 'Server error while requesting OTP' });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify login code and issue JWT
// @access  Public
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.otpCodeHash || !user.otpExpiresAt) {
      return res.status(400).json({ message: 'No active verification code. Please request a new one.' });
    }

    if (new Date() > new Date(user.otpExpiresAt)) {
      return res.status(400).json({ message: 'Verification code has expired' });
    }

    const valid = await verifyOtpHash(code, user.otpCodeHash);
    if (!valid) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Clear OTP fields and update lastLogin
    user.otpCodeHash = null;
    user.otpExpiresAt = null;
    user.lastLogin = new Date();
    await user.save();

    // Issue token
    const token = generateToken(user._id);
    res.json({
      message: 'Verification successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        college: user.college,
        vendorDetails: user.vendorDetails,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error while verifying OTP' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        college: req.user.college,
        phone: req.user.phone,
        studentId: req.user.studentId,
        year: req.user.year,
        department: req.user.department,
        address: req.user.address,
        dateOfBirth: req.user.dateOfBirth,
        emergencyContact: req.user.emergencyContact,
        bio: req.user.bio,
        vendorDetails: req.user.vendorDetails,
        profileImage: req.user.profileImage,
        lastLogin: req.user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, uploadSingle('profileImage'), async (req, res) => {
  try {
    const { 
      name, 
      phone, 
      college, 
      studentId, 
      year, 
      department, 
      address, 
      dateOfBirth, 
      emergencyContact, 
      bio 
    } = req.body;
    
    const updateData = {};

    // Basic fields
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (college) updateData.college = college;
    
    // Student-specific fields
    if (studentId) updateData.studentId = studentId;
    if (year) updateData.year = year;
    if (department) updateData.department = department;
    if (address) updateData.address = address;
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
    if (emergencyContact) updateData.emergencyContact = emergencyContact;
    if (bio !== undefined) updateData.bio = bio; // Allow empty string
    
    if (req.file) updateData.profileImage = req.file.path;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id);
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error during password change' });
  }
});

module.exports = router;