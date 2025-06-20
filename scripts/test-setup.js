const mongoose = require('mongoose');
require('dotenv').config();

async function testSetup() {
  console.log('🧪 Testing FeedbackHub Setup...\n');
  
  try {
    // Test MongoDB connection
    console.log('📊 Testing MongoDB connection...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/feedbackhub', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connection successful');
    
    // Test if collections exist
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📋 Found ${collections.length} collections in database`);
    
    // Test Product model
    const Product = mongoose.model('Product', {
      name: String,
      description: String,
      price: Number,
      category: String
    });
    
    const productCount = await Product.countDocuments();
    console.log(`📦 Found ${productCount} products in database`);
    
    if (productCount === 0) {
      console.log('⚠️  No products found. Run "npm run seed" to add sample data');
    }
    
    // Test User model
    const User = mongoose.model('User', {
      firstName: String,
      lastName: String,
      email: String,
      password: String
    });
    
    const userCount = await User.countDocuments();
    console.log(`👥 Found ${userCount} users in database`);
    
    // Test Review model
    const Review = mongoose.model('Review', {
      productId: mongoose.Schema.Types.ObjectId,
      userId: mongoose.Schema.Types.ObjectId,
      rating: Number,
      content: String,
      source: String
    });
    
    const reviewCount = await Review.countDocuments();
    console.log(`⭐ Found ${reviewCount} reviews in database`);
    
    console.log('\n✅ Setup test completed successfully!');
    console.log('\n🚀 You can now start the application with: npm start');
    
  } catch (error) {
    console.error('❌ Setup test failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Make sure MongoDB is running');
    console.log('2. Check your .env file configuration');
    console.log('3. Verify network connectivity');
    console.log('4. Run "npm install" to ensure all dependencies are installed');
  } finally {
    mongoose.connection.close();
  }
}

testSetup();
