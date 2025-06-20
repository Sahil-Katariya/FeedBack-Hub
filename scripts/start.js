const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting FeedbackHub Development Server...\n');

// Check if MongoDB is running (optional check)
console.log('📋 Pre-flight checks:');
console.log('✅ Node.js is running');
console.log('⚠️  Make sure MongoDB is running on your system');
console.log('⚠️  Make sure you have run "npm install" to install dependencies\n');

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
