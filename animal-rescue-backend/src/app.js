const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

// Health check - useful to confirm server is alive
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', message: 'Animal Rescue backend is running' });
});

app.use('/api/v1/auth', authRoutes);

// Keep error handler last
app.use(errorHandler);

module.exports = app;
