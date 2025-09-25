const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 MongoDB Setup and Configuration Tool\n');

// Check if MongoDB is installed
function checkMongoDBInstallation() {
  return new Promise((resolve) => {
    exec('mongod --version', (error, stdout, stderr) => {
      if (error) {
        console.log('❌ MongoDB is not installed or not in PATH');
        resolve(false);
      } else {
        console.log('✅ MongoDB is installed');
        console.log('📋 Version:', stdout.split('\n')[0]);
        resolve(true);
      }
    });
  });
}

// Check if MongoDB service is running
function checkMongoDBService() {
  return new Promise((resolve) => {
    exec('tasklist /FI "IMAGENAME eq mongod.exe"', (error, stdout, stderr) => {
      if (stdout.includes('mongod.exe')) {
        console.log('✅ MongoDB service is running');
        resolve(true);
      } else {
        console.log('❌ MongoDB service is not running');
        resolve(false);
      }
    });
  });
}

// Start MongoDB service
function startMongoDBService() {
  return new Promise((resolve) => {
    console.log('🚀 Attempting to start MongoDB service...');
    
    // Try to start as Windows service first
    exec('net start MongoDB', (error, stdout, stderr) => {
      if (!error) {
        console.log('✅ MongoDB service started successfully');
        resolve(true);
      } else {
        console.log('⚠️  Could not start MongoDB as Windows service');
        console.log('💡 You may need to start MongoDB manually');
        resolve(false);
      }
    });
  });
}

// Create MongoDB data directory
function createDataDirectory() {
  const dataDir = path.join(process.cwd(), 'mongodb-data');
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('📁 Created MongoDB data directory:', dataDir);
  } else {
    console.log('📁 MongoDB data directory exists:', dataDir);
  }
  
  return dataDir;
}

// Start MongoDB manually
function startMongoDBManually() {
  return new Promise((resolve) => {
    const dataDir = createDataDirectory();
    
    console.log('🚀 Starting MongoDB manually...');
    console.log('📁 Data directory:', dataDir);
    
    const mongod = spawn('mongod', ['--dbpath', dataDir, '--port', '27017'], {
      stdio: 'pipe'
    });
    
    mongod.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('waiting for connections')) {
        console.log('✅ MongoDB started successfully on port 27017');
        resolve(true);
      }
    });
    
    mongod.stderr.on('data', (data) => {
      console.error('MongoDB error:', data.toString());
    });
    
    mongod.on('error', (error) => {
      console.error('❌ Failed to start MongoDB manually:', error.message);
      resolve(false);
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      console.log('⏰ MongoDB startup timeout');
      resolve(false);
    }, 30000);
  });
}

// Test MongoDB connection
function testConnection() {
  return new Promise((resolve) => {
    const mongoose = require('mongoose');
    
    console.log('🔍 Testing MongoDB connection...');
    
    mongoose.connect('mongodb://localhost:27017/feedbackhub-test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    
    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connection test successful');
      mongoose.connection.close();
      resolve(true);
    });
    
    mongoose.connection.on('error', (err) => {
      console.log('❌ MongoDB connection test failed:', err.message);
      resolve(false);
    });
  });
}

// Main setup function
async function setupMongoDB() {
  console.log('🔍 Checking MongoDB installation...\n');
  
  const isInstalled = await checkMongoDBInstallation();
  
  if (!isInstalled) {
    console.log('\n📥 MongoDB Installation Required');
    console.log('Please install MongoDB from: https://www.mongodb.com/try/download/community');
    console.log('Or use MongoDB Atlas (cloud): https://www.mongodb.com/atlas');
    console.log('\n💡 Alternative: Update .env file to use MongoDB Atlas connection string');
    return false;
  }
  
  console.log('\n🔍 Checking MongoDB service...\n');
  
  const isRunning = await checkMongoDBService();
  
  if (!isRunning) {
    console.log('\n🚀 Attempting to start MongoDB...\n');
    
    const serviceStarted = await startMongoDBService();
    
    if (!serviceStarted) {
      console.log('\n🔧 Trying to start MongoDB manually...\n');
      const manualStarted = await startMongoDBManually();
      
      if (!manualStarted) {
        console.log('\n❌ Could not start MongoDB automatically');
        console.log('💡 Please start MongoDB manually:');
        console.log('   1. Open Command Prompt as Administrator');
        console.log('   2. Run: mongod --dbpath C:\\data\\db');
        console.log('   3. Or start MongoDB service from Services.msc');
        return false;
      }
    }
  }
  
  console.log('\n🔍 Testing connection...\n');
  
  const connectionOk = await testConnection();
  
  if (connectionOk) {
    console.log('\n🎉 MongoDB setup completed successfully!');
    console.log('✅ MongoDB is ready for FeedbackHub');
    return true;
  } else {
    console.log('\n❌ MongoDB connection test failed');
    console.log('💡 Please check MongoDB installation and try again');
    return false;
  }
}

// Run setup if called directly
if (require.main === module) {
  setupMongoDB().then((success) => {
    if (success) {
      console.log('\n🚀 You can now start the FeedbackHub server with: npm start');
    } else {
      console.log('\n🛑 Please resolve MongoDB issues before starting the server');
    }
    process.exit(success ? 0 : 1);
  });
}

module.exports = { setupMongoDB, checkMongoDBInstallation, testConnection };
