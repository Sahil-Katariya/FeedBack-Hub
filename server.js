const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;
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
    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token is not valid' });
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
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
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
        email: user.email
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
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
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

    res.json({
      totalReviews,
      avgRating: Math.round(avgRating * 10) / 10,
      badges,
      followers,
      following,
      score: totalReviews * 100 + Math.round(avgRating * 50) // Simple scoring system
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
        reviewTrend: this.calculateReviewTrend(reviews)
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
    const totalProducts = await Product.countDocuments();
    const totalReviews = await Review.countDocuments();
    const userReviews = await Review.countDocuments({ userId: req.user.id });
    
    const avgRatingResult = await Review.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    const avgRating = avgRatingResult.length > 0 ? avgRatingResult[0].avgRating : 0;
    
    res.json({
      totalProducts,
      totalReviews,
      userReviews,
      avgRating: Math.round(avgRating * 10) / 10
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
