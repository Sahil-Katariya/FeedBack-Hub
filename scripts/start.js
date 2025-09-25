const { spawn } = require('child_process');
const path = require('path');
const { setupMongoDB, testConnection } = require('./setup-mongodb');
const { clearPort, findAvailablePort } = require('./port-manager');

console.log('🚀 Starting FeedbackHub Development Server...\n');

async function startServer() {
  console.log('📋 Pre-flight checks:');
  console.log('✅ Node.js is running');

  // Check port availability
  const defaultPort = 5000;
  console.log(`🔍 Checking port ${defaultPort} availability...`);
  const portCleared = await clearPort(defaultPort);

  if (!portCleared) {
    console.log(`⚠️  Port ${defaultPort} is not available. Finding alternative...`);
    const availablePort = await findAvailablePort(defaultPort);

    if (availablePort) {
      console.log(`✅ Found available port: ${availablePort}`);
      console.log(`💡 Update your .env file: PORT=${availablePort}`);
      process.env.PORT = availablePort;
    } else {
      console.log('❌ No available ports found in range 5000-5010');
      console.log('💡 Please manually free port 5000 or update PORT in .env');
      process.exit(1);
    }
  } else {
    console.log(`✅ Port ${defaultPort} is available`);
  }

  // Check MongoDB connection
  console.log('🔍 Checking MongoDB connection...');
  const mongoOk = await testConnection();

  if (!mongoOk) {
    console.log('⚠️  MongoDB is not available. Attempting setup...\n');
    const setupSuccess = await setupMongoDB();

    if (!setupSuccess) {
      console.log('\n❌ MongoDB setup failed. Server cannot start without database.');
      console.log('💡 Options:');
      console.log('   1. Install MongoDB locally');
      console.log('   2. Use MongoDB Atlas (cloud)');
      console.log('   3. Update MONGODB_URI in .env file');
      process.exit(1);
    }
  } else {
    console.log('✅ MongoDB connection verified');
  }

  console.log('✅ All dependencies checked\n');

  // Start the server
  console.log('🔧 Starting Express server...');
  const server = spawn('node', ['server.js'], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  server.on('error', (err) => {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  });

  server.on('close', (code) => {
    console.log(`\n🛑 Server stopped with code ${code}`);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...');
    server.kill('SIGTERM');
  });
}

// Start the application
startServer().catch((error) => {
  console.error('❌ Failed to start application:', error.message);
  process.exit(1);
});
