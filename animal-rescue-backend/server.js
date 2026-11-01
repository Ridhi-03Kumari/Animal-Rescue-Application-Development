require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { initSocket } = require('./src/socket');
const {
  startEscalationProcessor,
  stopEscalationProcessor,
} = require('./src/services/escalationProcessor');

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

  // Start background persistent escalation processor
  startEscalationProcessor();
});

// Graceful shutdown handling
function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  stopEscalationProcessor();
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
