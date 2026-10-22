const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
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
const adoptionRoutes = require('./routes/adoptions');
const errorHandler = require('./middleware/errorHandler');
const { isDbConnected } = require('./utils/devStore');

const app = express();

// Security headers with Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Environment-driven CORS configuration
const isProduction = process.env.NODE_ENV === 'production';
const rawOrigins = process.env.CORS_ORIGIN;
const allowedOrigins = rawOrigins
  ? rawOrigins.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

if (isProduction && allowedOrigins.length === 0) {
  throw new Error(
    '[FATAL CONFIG ERROR] CORS_ORIGIN environment variable is required in production. ' +
    'Please set CORS_ORIGIN (e.g. CORS_ORIGIN=https://your-domain.com).'
  );
}

const corsOptions = {
  origin: (origin, callback) => {
    // Native mobile apps (React Native), curl, Postman, internal server requests send no Origin header
    if (!origin) {
      return callback(null, true);
    }

    if (!isProduction) {
      // In development, allow localhost/127.0.0.1 or all dev origins if none configured
      if (
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(origin) ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

app.use(cors(corsOptions));
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
    // 'mongodb' = real database connected, 'demo' = in-memory demo store
    database: isDbConnected() ? 'mongodb' : 'demo',
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
app.use('/api/v1/adoptions', adoptionRoutes);

// Unknown API routes -> JSON 404, then the error handler (keep both last)
app.use('/api', errorHandler.notFound);
app.use(errorHandler);

module.exports = app;
