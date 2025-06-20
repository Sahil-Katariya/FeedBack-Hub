const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/feedbackhub', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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
const Product = mongoose.model('Product', {
  name: String,
  description: String,
  price: Number,
  category: String,
  imageUrl: String
});

const User = mongoose.model('User', {
  firstName: String,
  lastName: String,
  email: String,
  password: String
});

// Sample detailed reviews for AI analysis
const sampleReviews = [
  // iPhone 15 Pro Reviews
  {
    rating: 5,
    content: "Absolutely amazing phone! The build quality is exceptional with the new titanium design. Performance is lightning fast, and the camera quality is outstanding. Battery life easily lasts a full day of heavy usage. The price is high but definitely worth it for the premium features and excellent user experience.",
    source: "Website"
  },
  {
    rating: 4,
    content: "Great phone overall. The performance is excellent and very smooth. Build quality feels premium and durable. However, the price is quite expensive compared to other options. Battery life is good but not exceptional. Easy to use interface as expected from Apple.",
    source: "Amazon"
  },
  {
    rating: 2,
    content: "Disappointed with this purchase. The price is way too expensive for what you get. Battery life is poor and drains quickly. Build quality feels cheap despite the premium materials. Performance is good but not worth the high cost. Difficult to justify the price point.",
    source: "Mobile App"
  },
  {
    rating: 5,
    content: "Perfect phone! Excellent build quality with the titanium construction feeling very premium and durable. Performance is incredibly fast and responsive. Battery life is fantastic, lasting well into the evening. Easy to use and intuitive interface. Worth every penny despite the high price.",
    source: "Website"
  },
  {
    rating: 3,
    content: "Average experience. Build quality is decent but not exceptional. Performance is good for most tasks. Battery life is okay but could be better. The price is too expensive for the features offered. User interface is easy to navigate but nothing revolutionary.",
    source: "In-store"
  },
  // Samsung Galaxy S24 Ultra Reviews
  {
    rating: 5,
    content: "Outstanding phone with incredible performance! The build quality is excellent and feels very premium. Battery life is amazing, easily lasting two days with moderate usage. The S Pen functionality is fantastic and very easy to use. Great value for the price considering all the features.",
    source: "Website"
  },
  {
    rating: 4,
    content: "Excellent phone overall. Performance is top-notch and very smooth. Build quality is solid and durable. Battery life is very good. The price is reasonable for a flagship device. Some features are difficult to find in the interface but generally easy to use.",
    source: "Amazon"
  },
  {
    rating: 1,
    content: "Terrible experience with this phone. Build quality feels cheap and flimsy. Performance is slow and laggy. Battery life is awful, barely lasting half a day. Way too expensive for such poor quality. Very difficult to use with a confusing interface. Would not recommend.",
    source: "Mobile App"
  },
  // MacBook Air M3 Reviews
  {
    rating: 5,
    content: "Incredible laptop! The build quality is exceptional with premium aluminum construction. Performance is blazing fast with the M3 chip handling everything smoothly. Battery life is outstanding, lasting 15+ hours of real usage. Easy to use and great value for the performance. Highly recommended!",
    source: "Website"
  },
  {
    rating: 4,
    content: "Great laptop with excellent performance. Build quality is very good and feels durable. Battery life is impressive, lasting a full work day easily. The price is reasonable for Apple standards. Very easy to use with intuitive macOS interface.",
    source: "Amazon"
  },
  {
    rating: 2,
    content: "Not impressed with this laptop. Build quality is okay but not exceptional for the price. Performance is good but not amazing. Battery life is decent but not as good as advertised. Too expensive compared to Windows alternatives. Some features are difficult to access.",
    source: "In-store"
  }
];

async function seedReviews() {
  try {
    console.log('Seeding detailed reviews for AI analysis...');
    
    // Get existing products and users
    const products = await Product.find().limit(3); // First 3 products
    const users = await User.find().limit(5); // First 5 users
    
    if (products.length === 0) {
      console.log('No products found. Please run seedData.js first.');
      return;
    }
    
    if (users.length === 0) {
      console.log('No users found. Please create some users first.');
      return;
    }
    
    // Clear existing reviews
    await Review.deleteMany({});
    console.log('Cleared existing reviews');
    
    const reviewsToInsert = [];
    
    // Add reviews for each product
    products.forEach((product, productIndex) => {
      const productReviews = sampleReviews.slice(productIndex * 4, (productIndex + 1) * 4);
      
      productReviews.forEach((reviewTemplate, reviewIndex) => {
        const randomUser = users[reviewIndex % users.length];
        
        reviewsToInsert.push({
          productId: product._id,
          userId: randomUser._id,
          rating: reviewTemplate.rating,
          content: reviewTemplate.content,
          source: reviewTemplate.source,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
        });
      });
    });
    
    // Insert reviews
    const insertedReviews = await Review.insertMany(reviewsToInsert);
    console.log(`Inserted ${insertedReviews.length} detailed reviews`);
    
    // Display summary
    console.log('\nReview Summary:');
    for (const product of products) {
      const productReviews = await Review.find({ productId: product._id });
      const avgRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
      console.log(`- ${product.name}: ${productReviews.length} reviews, avg rating: ${avgRating.toFixed(1)}`);
    }
    
    console.log('\n✅ Review seeding completed successfully!');
    console.log('🤖 These reviews are optimized for AI analysis with detailed sentiment and aspect mentions.');
    console.log('🔗 Visit product pages to see the AI analysis in action!');
    
  } catch (error) {
    console.error('Error seeding reviews:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the seeding function
seedReviews();
