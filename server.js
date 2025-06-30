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

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/feedbackhub', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
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
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
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

// Authentication middleware
const auth = (req, res, next) => {
  try {
    const token = req.header('x-auth-token');
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
    const token = req.header('x-auth-token');
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
    console.error('❌ Admin auth middleware - Error:', error.message);
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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
