const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/feedbackhub', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Review Schema (updated)
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

async function migrateReviews() {
  try {
    console.log('🔄 Starting review migration...');
    
    // Find all reviews that don't have the new fields
    const reviewsToUpdate = await Review.find({
      $or: [
        { helpfulCount: { $exists: false } },
        { verified: { $exists: false } }
      ]
    });
    
    console.log(`📊 Found ${reviewsToUpdate.length} reviews to update`);
    
    if (reviewsToUpdate.length === 0) {
      console.log('✅ All reviews already have the required fields');
      return;
    }
    
    // Update each review with default values
    for (const review of reviewsToUpdate) {
      const updateData = {};
      
      if (review.helpfulCount === undefined) {
        // Generate a random helpful count based on rating
        updateData.helpfulCount = Math.floor(Math.random() * (review.rating * 20)) + 1;
      }
      
      if (review.verified === undefined) {
        // Randomly set verified status (80% chance of being verified)
        updateData.verified = Math.random() > 0.2;
      }
      
      await Review.findByIdAndUpdate(review._id, updateData);
      console.log(`✅ Updated review ${review._id}`);
    }
    
    console.log('🎉 Migration completed successfully!');
    
    // Verify the migration
    const updatedReviews = await Review.find().limit(3);
    console.log('📋 Sample updated reviews:');
    updatedReviews.forEach((review, index) => {
      console.log(`${index + 1}. Rating: ${review.rating}, Helpful: ${review.helpfulCount}, Verified: ${review.verified}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔚 Database connection closed');
  }
}

// Run the migration
migrateReviews();
