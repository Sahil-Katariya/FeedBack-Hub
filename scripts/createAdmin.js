const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// User Schema (same as in server.js)
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

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/feedbackhub', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🔗 Connected to MongoDB');
    console.log('👤 Creating Admin User for FeedbackHub\n');

    // Use command line arguments or defaults
    const args = process.argv.slice(2);
    const adminData = {
      firstName: args[0] || 'Admin',
      lastName: args[1] || 'User',
      email: args[2] || 'admin@feedbackhub.com',
      password: args[3] || 'admin123',
      role: 'admin',
      location: args[4] || 'System',
      bio: args[5] || 'System Administrator',
      isActive: true
    };

    console.log('📝 Admin Details:');
    console.log(`   Name: ${adminData.firstName} ${adminData.lastName}`);
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Password: ${adminData.password}`);
    console.log(`   Location: ${adminData.location}`);
    console.log(`   Bio: ${adminData.bio}\n`);

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists with email:', adminData.email);

      // Update existing user to admin role if not already
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        existingAdmin.isActive = true;
        await existingAdmin.save();
        console.log('✅ Updated existing user to admin role');
      } else {
        console.log('ℹ️  User already has admin role');
      }

      // Update password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminData.password, salt);
      existingAdmin.password = hashedPassword;
      await existingAdmin.save();
      console.log('✅ Password updated successfully');

      console.log('\n📧 Email:', adminData.email);
      console.log('🔑 Password:', adminData.password);
      console.log('🌐 Access admin panel at: http://localhost:5000/admin.html');
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminData.password, salt);

    // Create admin user
    const adminUser = new User({
      ...adminData,
      password: hashedPassword
    });

    await adminUser.save();

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminData.email);
    console.log('🔑 Password:', adminData.password);
    console.log('👤 Name:', `${adminData.firstName} ${adminData.lastName}`);
    console.log('📍 Location:', adminData.location);
    console.log('📝 Bio:', adminData.bio);
    console.log('\n⚠️  Please change the password after first login for security');
    console.log('🌐 Access admin panel at: http://localhost:5000/admin.html');

  } catch (error) {
    console.error('\n❌ Error creating admin user:', error);
    if (error.code === 11000) {
      console.error('💡 This email is already registered. Use a different email or update the existing user.');
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n\n👋 Process interrupted. Closing database connection...');
  await mongoose.connection.close();
  process.exit(0);
});

// Run the script
createAdminUser();
