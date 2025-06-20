const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/feedbackhub', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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

// Sample products data
const sampleProducts = [
  {
    name: "iPhone 15 Pro",
    description: "The latest iPhone with advanced camera system and A17 Pro chip. Features titanium design and Action Button.",
    price: 999.99,
    imageUrl: "placeholder1.jpg",
    category: "Electronics"
  },
  {
    name: "Samsung Galaxy S24 Ultra",
    description: "Premium Android smartphone with S Pen, 200MP camera, and AI-powered features.",
    price: 1199.99,
    imageUrl: "placeholder2.jpg",
    category: "Electronics"
  },
  {
    name: "MacBook Air M3",
    description: "Ultra-thin laptop with M3 chip, 18-hour battery life, and stunning Liquid Retina display.",
    price: 1099.99,
    imageUrl: "placeholder3.jpg",
    category: "Computers"
  },
  {
    name: "Sony WH-1000XM5",
    description: "Industry-leading noise canceling wireless headphones with exceptional sound quality.",
    price: 399.99,
    imageUrl: "placeholder4.jpg",
    category: "Audio"
  },
  {
    name: "iPad Pro 12.9",
    description: "Most advanced iPad with M2 chip, Liquid Retina XDR display, and Apple Pencil support.",
    price: 1099.99,
    imageUrl: "placeholder5.jpg",
    category: "Tablets"
  },
  {
    name: "Nintendo Switch OLED",
    description: "Gaming console with vibrant OLED screen, enhanced audio, and versatile play modes.",
    price: 349.99,
    imageUrl: "placeholder6.jpg",
    category: "Gaming"
  },
  {
    name: "Tesla Model 3",
    description: "Electric vehicle with autopilot, long range, and minimalist interior design.",
    price: 38990.00,
    imageUrl: "placeholder7.jpg",
    category: "Automotive"
  },
  {
    name: "Dyson V15 Detect",
    description: "Cordless vacuum with laser dust detection and powerful suction technology.",
    price: 749.99,
    imageUrl: "placeholder8.jpg",
    category: "Home Appliances"
  },
  {
    name: "Apple Watch Series 9",
    description: "Advanced smartwatch with health monitoring, fitness tracking, and cellular connectivity.",
    price: 399.99,
    imageUrl: "placeholder9.jpg",
    category: "Wearables"
  },
  {
    name: "Canon EOS R5",
    description: "Professional mirrorless camera with 45MP sensor and 8K video recording capabilities.",
    price: 3899.99,
    imageUrl: "placeholder10.jpg",
    category: "Photography"
  }
];

async function seedDatabase() {
  try {
    console.log('Connecting to database...');
    
    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');
    
    // Insert sample products
    const insertedProducts = await Product.insertMany(sampleProducts);
    console.log(`Inserted ${insertedProducts.length} sample products`);
    
    console.log('Sample products:');
    insertedProducts.forEach(product => {
      console.log(`- ${product.name} ($${product.price})`);
    });
    
    console.log('Database seeding completed successfully!');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the seeding function
seedDatabase();
