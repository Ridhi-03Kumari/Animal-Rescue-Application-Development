const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');
const caseRoutes = require('./routes/cases');
const rescuerRoutes = require('./routes/rescuers');
const dispatchRoutes = require('./routes/dispatch');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

// Health check - useful to confirm server is alive
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', message: 'Animal Rescue backend is running' });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/cases', caseRoutes);
app.use('/api/v1/rescuers', rescuerRoutes);
app.use('/api/v1/dispatch', dispatchRoutes);

// Keep error handler last
app.use(errorHandler);

module.exports = app;
