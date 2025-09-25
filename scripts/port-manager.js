const { exec } = require('child_process');
const net = require('net');

// Check if a port is available
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.close(() => {
        resolve(true);
      });
    });
    
    server.on('error', () => {
      resolve(false);
    });
  });
}

// Find what process is using a port
function findProcessUsingPort(port) {
  return new Promise((resolve) => {
    exec(`netstat -ano | findstr :${port}`, (error, stdout, stderr) => {
      if (error || !stdout) {
        resolve(null);
        return;
      }
      
      const lines = stdout.split('\n').filter(line => line.includes('LISTENING'));
      if (lines.length > 0) {
        const parts = lines[0].trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        resolve(pid);
      } else {
        resolve(null);
      }
    });
  });
}

// Kill process by PID
function killProcess(pid) {
  return new Promise((resolve) => {
    exec(`taskkill /PID ${pid} /F`, (error, stdout, stderr) => {
      if (error) {
        console.log(`❌ Failed to kill process ${pid}:`, error.message);
        resolve(false);
      } else {
        console.log(`✅ Successfully killed process ${pid}`);
        resolve(true);
      }
    });
  });
}

// Get process name by PID
function getProcessName(pid) {
  return new Promise((resolve) => {
    exec(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, (error, stdout, stderr) => {
      if (error || !stdout) {
        resolve('Unknown');
        return;
      }
      
      const lines = stdout.split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        const parts = lines[0].split(',');
        const processName = parts[0].replace(/"/g, '');
        resolve(processName);
      } else {
        resolve('Unknown');
      }
    });
  });
}

// Clear port by killing the process using it
async function clearPort(port) {
  console.log(`🔍 Checking if port ${port} is available...`);
  
  const available = await isPortAvailable(port);
  if (available) {
    console.log(`✅ Port ${port} is available`);
    return true;
  }
  
  console.log(`⚠️  Port ${port} is in use`);
  
  const pid = await findProcessUsingPort(port);
  if (!pid) {
    console.log(`❌ Could not find process using port ${port}`);
    return false;
  }
  
  const processName = await getProcessName(pid);
  console.log(`🔍 Found process: ${processName} (PID: ${pid})`);
  
  // Ask user for confirmation (in a real scenario)
  console.log(`🛑 Attempting to kill process ${processName} (PID: ${pid})...`);
  
  const killed = await killProcess(pid);
  if (killed) {
    // Wait a moment for the port to be released
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const nowAvailable = await isPortAvailable(port);
    if (nowAvailable) {
      console.log(`✅ Port ${port} is now available`);
      return true;
    } else {
      console.log(`❌ Port ${port} is still not available`);
      return false;
    }
  }
  
  return false;
}

// Find next available port
async function findAvailablePort(startPort = 5000, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    const available = await isPortAvailable(port);
    if (available) {
      return port;
    }
  }
  return null;
}

module.exports = {
  isPortAvailable,
  findProcessUsingPort,
  killProcess,
  getProcessName,
  clearPort,
  findAvailablePort
};
