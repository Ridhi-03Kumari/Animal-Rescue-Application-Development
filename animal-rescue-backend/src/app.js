const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');
const caseRoutes = require('./routes/cases');
const rescuerRoutes = require('./routes/rescuers');
const dispatchRoutes = require('./routes/dispatch');
const triageRoutes = require('./routes/triage');
const animalRoutes = require('./routes/animals');
const contactRoutes = require('./routes/contacts');
const coordinatorRoutes = require('./routes/coordinator');
const uploadRoutes = require('./routes/upload');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads directory for animal photos
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Health check - confirms system readiness and active features
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Animal Emergency Rescue & Smart Response API is running',
    city: 'Bengaluru',
    features: [
      'smart_dispatch_scoring',
      'gemini_ai_triage',
      'socket_live_tracking',
      'qr_digital_animal_profiles',
      'emergency_contacts_bengaluru',
      'coordinator_manual_intervention',
    ],
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/cases', caseRoutes);
app.use('/api/v1/rescuers', rescuerRoutes);
app.use('/api/v1/dispatch', dispatchRoutes);
app.use('/api/v1/triage', triageRoutes);
app.use('/api/v1/animals', animalRoutes);
app.use('/api/v1/contacts', contactRoutes);
app.use('/api/v1/coordinator', coordinatorRoutes);
app.use('/api/v1/upload', uploadRoutes);

// Keep error handler last
app.use(errorHandler);

module.exports = app;
