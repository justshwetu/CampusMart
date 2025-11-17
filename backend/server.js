const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');
const Product = require('./models/Product');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// Configure CORS: be permissive in development to support various preview origins
const isDev = process.env.NODE_ENV !== 'production';
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (isDev) {
      // In development, allow any origin to simplify local preview and network URLs
      return callback(null, true);
    }

    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174'
    ];

    const isAllowed = allowedOrigins.includes(origin) ||
      /^http:\/\/127\.0\.[0-9]+\.[0-9]+:517[3-4]$/.test(origin);

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vendors', require('./routes/vendors'));
app.use('/api/products', require('./routes/products'));
app.use('/api/marketplace', require('./routes/marketplace'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/chat', require('./routes/chat'));

// MongoDB Connection with retry for reliability
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusmart';
let memoryServer = null;
const connectWithRetry = async (retries = 10, delayMs = 2000) => {
  let attempt = 0;
  while (attempt < retries) {
    try {
      await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('MongoDB connected successfully');
      return true;
    } catch (err) {
      attempt += 1;
      const remaining = retries - attempt;
      console.error(`MongoDB connection error (attempt ${attempt}/${retries}):`, err?.message || err);
      if (remaining <= 0) {
        console.warn('Exceeded maximum MongoDB connection attempts. Falling back to in-memory MongoDB for development.');
        try {
          memoryServer = await MongoMemoryServer.create();
          const memUri = memoryServer.getUri('campusmart');
          await mongoose.connect(memUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
          });
          console.log('✅ Connected to in-memory MongoDB instance');
          console.log('ℹ️ Note: Data will reset on server restart. Configure MONGODB_URI for persistent storage.');
          return true;
        } catch (memErr) {
          console.error('❌ Failed to start in-memory MongoDB:', memErr?.message || memErr);
          break;
        }
      }
      await new Promise(res => setTimeout(res, delayMs));
    }
  }
  return false;
};

connectWithRetry();

// Seed minimal sample data in development if database is empty
const ensureSampleData = async () => {
  try {
    const vendorCount = await User.countDocuments({ role: 'vendor' });
    if (vendorCount > 0) {
      return;
    }

    const vendors = [
      {
        name: 'Spice Hub',
        email: 'spicehub@campusmart.com',
        password: 'vendor123',
        phone: '+1234567001',
        vendorDetails: {
          businessName: 'Spice Hub',
          businessType: 'fast-food',
          location: 'Main Canteen',
          isApproved: true,
          approvedAt: new Date()
        },
        products: [
          {
            name: 'Masala Maggie Bowl',
            description: 'Spicy maggie with veggies and special masala.',
            price: 60,
            category: 'meals',
            images: ['https://images.unsplash.com/photo-1604908176997-46efc7e4b3f5?w=400&h=300&fit=crop&crop=center']
          },
          {
            name: 'Paneer Roll',
            description: 'Grilled paneer tikka wrapped in fresh roti.',
            price: 90,
            category: 'snacks',
            images: ['https://images.unsplash.com/photo-1601050690597-8f012f0528a7?w=400&h=300&fit=crop&crop=center']
          }
        ]
      },
      {
        name: 'Sweet Treats',
        email: 'sweettreats@campusmart.com',
        password: 'vendor123',
        phone: '+1234567002',
        vendorDetails: {
          businessName: 'Sweet Treats',
          businessType: 'desserts',
          location: 'Hostel Block A',
          isApproved: true,
          approvedAt: new Date()
        },
        products: [
          {
            name: 'Chocolate Brownie',
            description: 'Rich chocolate brownie with nuts.',
            price: 70,
            category: 'desserts',
            images: ['https://images.unsplash.com/photo-1548365328-9b6c2a23ef34?w=400&h=300&fit=crop&crop=center']
          },
          {
            name: 'Cold Coffee',
            description: 'Iced coffee with a smooth blend.',
            price: 80,
            category: 'beverages',
            images: ['https://images.unsplash.com/photo-1512568400610-62da28bc8a13?w=400&h=300&fit=crop&crop=center']
          }
        ]
      }
    ];

    for (const v of vendors) {
      let user = await User.findOne({ email: v.email });
      if (!user) {
        user = new User({
          name: v.name,
          email: v.email,
          password: v.password,
          role: 'vendor',
          phone: v.phone,
          college: 'Campus University',
          vendorDetails: v.vendorDetails
        });
        await user.save();
      }
      for (const p of v.products) {
        const exists = await Product.findOne({ name: p.name, vendor: user._id });
        if (!exists) {
          const prod = new Product({ ...p, vendor: user._id, isAvailable: true });
          await prod.save();
        }
      }
    }
    console.log('🌱 Seeded sample vendors and products');
  } catch (e) {
    console.warn('Seed data skipped:', e?.message || e);
  }
};

mongoose.connection.once('open', ensureSampleData);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Campus Mart API is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`🔒 Local access: http://localhost:${PORT}`);
  console.log(`📡 API Base: http://localhost:${PORT}/api`);
  console.log('\n🏠 Local development mode');
  console.log('📱 Frontend: http://localhost:5173');
  console.log('🔧 API Test: http://localhost:5173/api-test');
  process.on('SIGINT', async () => {
    if (memoryServer) {
      await memoryServer.stop();
    }
    process.exit(0);
  });
});