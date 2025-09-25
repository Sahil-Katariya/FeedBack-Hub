const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// MongoDB connection with error handling
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/feedbackhub';

console.log('🔗 Attempting to connect to MongoDB...');
console.log('📍 MongoDB URI:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// MongoDB connection event handlers
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected successfully');
  console.log('📊 Database:', mongoose.connection.name);
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
  console.log('💡 Troubleshooting tips:');
  console.log('   1. Make sure MongoDB is installed and running');
  console.log('   2. Check if MongoDB service is started');
  console.log('   3. Verify the connection string in .env file');
  console.log('   4. For local MongoDB: mongod --dbpath /path/to/data');
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed');
  process.exit(0);
});

// User Schema
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: { type: String, default: 'profile photo.svg' },
  location: { type: String, default: '' },
  bio: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin', 'moderator'], default: 'user' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  imageUrl: { type: String },
  category: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);

// Review Schema
const reviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  content: { type: String, required: true },
  source: { type: String, required: true },
  helpfulCount: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Review = mongoose.model('Review', reviewSchema);

// Notification Schema
const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', notificationSchema);

// Helper to extract token from headers (x-auth-token or Authorization: Bearer)
function getTokenFromReq(req) {
  const headerToken = req.header('x-auth-token') || req.header('authorization') || req.header('Authorization');
  if (!headerToken) return null;
  if (headerToken.startsWith('Bearer ')) return headerToken.slice(7);
  return headerToken;
}

// Authentication middleware
const auth = (req, res, next) => {
  try {
    const token = getTokenFromReq(req);
    console.log('🔐 Auth middleware - Token received:', token ? token.substring(0, 20) + '...' : 'No token');

    if (!token) {
      console.log('❌ Auth middleware - No token provided');
      return res.status(401).json({
        error: 'No token, authorization denied',
        message: 'Authentication token is required'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Auth middleware - Token verified for user:', decoded.id);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('❌ Auth middleware - Token verification failed:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Your session has expired. Please login again.'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Authentication token is invalid'
      });
    } else {
      return res.status(401).json({
        error: 'Token verification failed',
        message: 'Authentication failed'
      });
    }
  }
};

// Admin middleware
const adminAuth = async (req, res, next) => {
  try {
    // First check if user is authenticated
    const token = getTokenFromReq(req);
    if (!token) {
      return res.status(401).json({
        error: 'No token, authorization denied',
        message: 'Authentication token is required'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        message: 'User account no longer exists'
      });
    }

    if (user.role !== 'admin' && user.role !== 'moderator') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Admin or moderator privileges required'
      });
    }

    req.user = { ...decoded, role: user.role };
    next();
  } catch (error) {
    console.error('❌ Admin auth middleware - Error:', error.message);
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid or expired token'
    });
  }
};

// Admin-only middleware (stricter than adminAuth)
const adminOnly = async (req, res, next) => {
  try {
    const token = getTokenFromReq(req);
    if (!token) {
      return res.status(401).json({
        error: 'No token, authorization denied',
        message: 'Authentication token is required'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        message: 'User account no longer exists'
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Admin privileges required'
      });
    }

    req.user = { ...decoded, role: user.role };
    next();
  } catch (error) {
    console.error('❌ Admin-only auth middleware - Error:', error.message);
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid or expired token'
    });
  }
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword
    });
    
    await user.save();
    
    // Create welcome notification
    const notification = new Notification({
      userId: user._id,
      message: 'Welcome to FeedbackHub! Start exploring product reviews.',
      type: 'success'
    });
    await notification.save();
    
    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get current user info
app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        profilePicture: user.profilePicture,
        location: user.location,
        bio: user.bio,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({ error: error.message });
  }
});

// User Routes
app.get('/api/user', auth, async (req, res) => {
  try {
    console.log('🔄 Fetching user data for ID:', req.user.id);
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      console.log('❌ User not found for ID:', req.user.id);
      return res.status(404).json({
        error: 'User not found',
        message: 'User account no longer exists'
      });
    }

    console.log('✅ User data found:', user.email);
    res.json(user);
  } catch (error) {
    console.error('❌ Error fetching user data:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch user data'
    });
  }
});

app.put('/api/user/profile', auth, async (req, res) => {
  try {
    const { firstName, lastName, email, profilePicture, location, bio } = req.body;

    // Check if email is being changed and if it's already in use
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (profilePicture) updateData.profilePicture = profilePicture;
    if (location) updateData.location = location;
    if (bio) updateData.bio = bio;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select('-password');

    res.json({ success: true, user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/user/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(req.user.id, { password: hashedPassword });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/user/stats', auth, async (req, res) => {
  try {
    console.log('🔄 Fetching user stats for ID:', req.user.id);
    const userReviews = await Review.find({ userId: req.user.id });
    const totalReviews = userReviews.length;

    const avgRating = totalReviews > 0
      ? userReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;

    // Get user's badges/achievements (placeholder for now)
    const badges = 4; // This could be calculated based on user activity

    // Get followers/following (placeholder for future social features)
    const followers = 0;
    const following = 0;

    const userStats = {
      totalReviews,
      avgRating: Math.round(avgRating * 10) / 10,
      badges,
      followers,
      following,
      score: totalReviews * 100 + Math.round(avgRating * 50) // Simple scoring system
    };

    console.log('✅ User stats calculated:', userStats);
    res.json(userStats);
  } catch (error) {
    console.error('❌ Error fetching user stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch user statistics'
    });
  }
});

// Product Routes
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products', auth, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products/:id/analytics', async (req, res) => {
  try {
    const productId = req.params.id;

    // Get product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get all reviews for this product
    const reviews = await Review.find({ productId })
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: -1 });

    // Calculate analytics
    const totalReviews = reviews.length;
    const ratings = reviews.map(r => r.rating).filter(r => r > 0);
    const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;

    // Rating distribution
    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length
    };

    // Recent reviews (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentReviews = reviews.filter(r => new Date(r.createdAt) > thirtyDaysAgo);

    // Source distribution
    const sourceDistribution = {};
    reviews.forEach(review => {
      sourceDistribution[review.source] = (sourceDistribution[review.source] || 0) + 1;
    });

    res.json({
      product,
      analytics: {
        totalReviews,
        avgRating: Math.round(avgRating * 10) / 10,
        ratingDistribution,
        recentReviewsCount: recentReviews.length,
        sourceDistribution,
        reviewTrend: calculateReviewTrend(reviews)
      },
      reviews: reviews.slice(0, 10) // Latest 10 reviews
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to calculate review trend
function calculateReviewTrend(reviews) {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const lastMonthReviews = reviews.filter(r => {
    const reviewDate = new Date(r.createdAt);
    return reviewDate >= lastMonth && reviewDate < thisMonth;
  });

  const thisMonthReviews = reviews.filter(r => {
    const reviewDate = new Date(r.createdAt);
    return reviewDate >= thisMonth;
  });

  const lastMonthAvg = lastMonthReviews.length > 0
    ? lastMonthReviews.reduce((sum, r) => sum + r.rating, 0) / lastMonthReviews.length
    : 0;

  const thisMonthAvg = thisMonthReviews.length > 0
    ? thisMonthReviews.reduce((sum, r) => sum + r.rating, 0) / thisMonthReviews.length
    : 0;

  return {
    lastMonth: {
      count: lastMonthReviews.length,
      avgRating: Math.round(lastMonthAvg * 10) / 10
    },
    thisMonth: {
      count: thisMonthReviews.length,
      avgRating: Math.round(thisMonthAvg * 10) / 10
    },
    trend: thisMonthAvg > lastMonthAvg ? 'improving' : thisMonthAvg < lastMonthAvg ? 'declining' : 'stable'
  };
}

// Review Routes
app.get('/api/reviews', async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('productId', 'name')
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reviews', auth, async (req, res) => {
  try {
    const review = new Review({
      ...req.body,
      userId: req.user.id
    });
    await review.save();
    
    // Create notification for review submission
    const notification = new Notification({
      userId: req.user.id,
      message: 'Your review has been submitted successfully!',
      type: 'success'
    });
    await notification.save();
    
    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/reviews/product/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId })
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Notification Routes
app.get('/api/notifications', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/notifications/:id/read', auth, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard Stats Route
app.get('/api/dashboard/stats', auth, async (req, res) => {
  try {
    console.log('🔄 Fetching dashboard stats for user:', req.user.id);

    const totalProducts = await Product.countDocuments();
    const totalReviews = await Review.countDocuments();
    const userReviews = await Review.countDocuments({ userId: req.user.id });

    const avgRatingResult = await Review.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    const avgRating = avgRatingResult.length > 0 ? avgRatingResult[0].avgRating : 0;

    const dashboardStats = {
      totalProducts,
      totalReviews,
      userReviews,
      avgRating: Math.round(avgRating * 10) / 10
    };

    console.log('✅ Dashboard stats calculated:', dashboardStats);
    res.json(dashboardStats);
  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch dashboard statistics'
    });
  }
});

// Admin Routes
// Admin Dashboard Stats
app.get('/api/admin/stats', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalReviews = await Review.countDocuments();
    const totalNotifications = await Notification.countDocuments();

    // Active users (logged in within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: thirtyDaysAgo }
    });

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    const recentProducts = await Product.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    const recentReviews = await Review.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Average rating
    const avgRatingResult = await Review.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    const avgRating = avgRatingResult.length > 0 ? avgRatingResult[0].avgRating : 0;

    res.json({
      overview: {
        totalUsers,
        totalProducts,
        totalReviews,
        totalNotifications,
        activeUsers,
        avgRating: Math.round(avgRating * 10) / 10
      },
      recentActivity: {
        newUsers: recentUsers,
        newProducts: recentProducts,
        newReviews: recentReviews
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// User Management
app.get('/api/admin/users', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const status = req.query.status || '';

    let query = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    if (status) {
      query.isActive = status === 'active';
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/users', adminOnly, async (req, res) => {
  try {
    const { firstName, lastName, email, password, role = 'user', isActive = true } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ firstName, lastName, email, password: hashedPassword, role, isActive });
    await user.save();

    const safeUser = await User.findById(user._id).select('-password');
    res.status(201).json({ success: true, user: safeUser });
  } catch (error) {
    console.error('Admin create user error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/users/:id', adminAuth, async (req, res) => {
  try {
    const { role, isActive } = req.body;
    const updateData = {};

    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Admin update user error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Also delete user's reviews and notifications
    await Review.deleteMany({ userId: req.params.id });
    await Notification.deleteMany({ userId: req.params.id });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Product Management
app.get('/api/admin/products', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const category = req.query.category || '';

    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    // Get review counts for each product
    const productsWithStats = await Promise.all(
      products.map(async (product) => {
        const reviewCount = await Review.countDocuments({ productId: product._id });
        const avgRatingResult = await Review.aggregate([
          { $match: { productId: product._id } },
          { $group: { _id: null, avgRating: { $avg: '$rating' } } }
        ]);
        const avgRating = avgRatingResult.length > 0 ? avgRatingResult[0].avgRating : 0;

        return {
          ...product.toObject(),
          reviewCount,
          avgRating: Math.round(avgRating * 10) / 10
        };
      })
    );

    res.json({
      products: productsWithStats,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Admin products error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/products/:id', adminAuth, async (req, res) => {
  try {
    const { name, description, price, category, imageUrl } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (category) updateData.category = category;
    if (imageUrl) updateData.imageUrl = imageUrl;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (error) {
    console.error('Admin update product error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/products/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Also delete product's reviews
    await Review.deleteMany({ productId: req.params.id });

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Admin delete product error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Review Management
app.get('/api/admin/reviews', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const rating = req.query.rating || '';
    const verified = req.query.verified || '';

    let query = {};

    if (search) {
      query.content = { $regex: search, $options: 'i' };
    }

    if (rating) {
      query.rating = parseInt(rating);
    }

    if (verified !== '') {
      query.verified = verified === 'true';
    }

    const reviews = await Review.find(query)
      .populate('productId', 'name imageUrl')
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments(query);

    res.json({
      reviews,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Admin reviews error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/reviews/:id', adminAuth, async (req, res) => {
  try {
    const { verified } = req.body;
    const updateData = {};

    if (verified !== undefined) updateData.verified = verified;

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('productId', 'name').populate('userId', 'firstName lastName');

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ success: true, review });
  } catch (error) {
    console.error('Admin update review error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/reviews/:id', adminAuth, async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Admin delete review error:', error);
    res.status(500).json({ error: error.message });
  }
});

// System Analytics
app.get('/api/admin/analytics', adminAuth, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // User registration trend
    const userTrend = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Review trend
    const reviewTrend = await Review.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          avgRating: { $avg: "$rating" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top categories
    const topCategories = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Rating distribution
    const ratingDistribution = await Review.aggregate([
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      userTrend,
      reviewTrend,
      topCategories,
      ratingDistribution
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Bulk Operations (Admin Only)
app.post('/api/admin/bulk/users', adminOnly, async (req, res) => {
  try {
    const { action, userIds, data } = req.body;

    switch (action) {
      case 'activate':
        await User.updateMany(
          { _id: { $in: userIds } },
          { isActive: true }
        );
        break;
      case 'deactivate':
        await User.updateMany(
          { _id: { $in: userIds } },
          { isActive: false }
        );
        break;
      case 'delete':
        await User.deleteMany({ _id: { $in: userIds } });
        await Review.deleteMany({ userId: { $in: userIds } });
        await Notification.deleteMany({ userId: { $in: userIds } });
        break;
      case 'updateRole':
        await User.updateMany(
          { _id: { $in: userIds } },
          { role: data.role }
        );
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    res.json({ success: true, message: `Bulk ${action} completed for ${userIds.length} users` });
  } catch (error) {
    console.error('Bulk user operation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/bulk/products', adminOnly, async (req, res) => {
  try {
    const { action, productIds, data } = req.body;

    switch (action) {
      case 'delete':
        await Product.deleteMany({ _id: { $in: productIds } });
        await Review.deleteMany({ productId: { $in: productIds } });
        break;
      case 'updateCategory':
        await Product.updateMany(
          { _id: { $in: productIds } },
          { category: data.category }
        );
        break;
      case 'updatePrice':
        await Product.updateMany(
          { _id: { $in: productIds } },
          { $mul: { price: data.multiplier } }
        );
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    res.json({ success: true, message: `Bulk ${action} completed for ${productIds.length} products` });
  } catch (error) {
    console.error('Bulk product operation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/bulk/reviews', adminAuth, async (req, res) => {
  try {
    const { action, reviewIds } = req.body;

    switch (action) {
      case 'verify':
        await Review.updateMany(
          { _id: { $in: reviewIds } },
          { verified: true }
        );
        break;
      case 'unverify':
        await Review.updateMany(
          { _id: { $in: reviewIds } },
          { verified: false }
        );
        break;
      case 'delete':
        await Review.deleteMany({ _id: { $in: reviewIds } });
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    res.json({ success: true, message: `Bulk ${action} completed for ${reviewIds.length} reviews` });
  } catch (error) {
    console.error('Bulk review operation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// System Settings
app.get('/api/admin/settings', adminOnly, async (req, res) => {
  try {
    // Get system settings (you can store these in a separate collection)
    const settings = {
      siteName: 'FeedbackHub',
      allowRegistration: true,
      requireEmailVerification: false,
      maxReviewsPerUser: 100,
      minPasswordLength: 6,
      sessionTimeout: 24, // hours
      maintenanceMode: false,
      featuredCategories: ['Electronics', 'Books', 'Clothing'],
      systemVersion: '1.1.0'
    };

    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export Data
app.get('/api/admin/export/:type', adminOnly, async (req, res) => {
  try {
    const { type } = req.params;
    const { format = 'json' } = req.query;

    let data;
    let filename;

    switch (type) {
      case 'users':
        data = await User.find().select('-password').lean();
        filename = `users_export_${new Date().toISOString().split('T')[0]}`;
        break;
      case 'products':
        data = await Product.find().lean();
        filename = `products_export_${new Date().toISOString().split('T')[0]}`;
        break;
      case 'reviews':
        data = await Review.find()
          .populate('userId', 'firstName lastName email')
          .populate('productId', 'name category')
          .lean();
        filename = `reviews_export_${new Date().toISOString().split('T')[0]}`;
        break;
      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      res.json(data);
    }
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to convert JSON to CSV
function convertToCSV(data) {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');

  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      if (typeof value === 'object' && value !== null) {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      return `"${String(value || '').replace(/"/g, '""')}"`;
    }).join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
}

// System Health Check
app.get('/api/admin/health', adminAuth, async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    // Check database performance
    const startTime = Date.now();
    await User.findOne().limit(1);
    const dbResponseTime = Date.now() - startTime;

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      database: {
        status: dbStatus,
        responseTime: `${dbResponseTime}ms`
      },
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024)
      },
      nodeVersion: process.version,
      platform: process.platform
    };

    res.json(health);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Activity Logs
app.get('/api/admin/logs', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50, type = 'all' } = req.query;

    // This is a simplified version. In production, you'd use a proper logging system
    const logs = [
      {
        id: 1,
        timestamp: new Date(),
        type: 'user_login',
        message: 'User logged in',
        userId: '507f1f77bcf86cd799439011',
        ip: '192.168.1.1'
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 3600000),
        type: 'admin_action',
        message: 'User role updated',
        userId: '507f1f77bcf86cd799439012',
        ip: '192.168.1.2'
      }
    ];

    res.json({
      logs: logs.slice((page - 1) * limit, page * limit),
      total: logs.length,
      page: parseInt(page),
      totalPages: Math.ceil(logs.length / limit)
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
