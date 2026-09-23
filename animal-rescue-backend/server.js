require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { initSocket } = require('./src/socket');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initSocket(server);

// Start HTTP & Socket server immediately
server.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO live tracking initialized`);
  console.log(`🩺 Health check: http://localhost:${PORT}/api/v1/health\n`);

  // Connect to database asynchronously
  connectDB();
});
