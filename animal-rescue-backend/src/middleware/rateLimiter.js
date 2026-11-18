const rateLimit = require('express-rate-limit');

// Protect authentication routes (login / register / password recovery) against credential stuffing and brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  // Strictly active in development and production (30 attempts per 15 mins per IP).
  // Test isolation uses an elevated limit when NODE_ENV === 'test' so test suites run reliably without bypassing the limiter middleware.
  max: process.env.NODE_ENV === 'test' ? (Number(process.env.TEST_AUTH_RATE_LIMIT) || 1000) : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

// Protect emergency report submission against automated spam / DoS
const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25, // 25 emergency reports per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many reports submitted from this device. Please wait a few minutes before submitting another report.',
  },
});

// Every photo upload is checked by Google Gemini (see services/imageValidationService.js), so protect that
// quota: a person needs about one upload per report, plus a few retakes.
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 photo uploads per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many photos sent from this device. Please wait a few minutes before sending another photo.',
  },
});

// Protect AI triage endpoint against quota exhaustion and scraping
const triageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 35, // 35 triage requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'AI triage request limit exceeded. Please wait a few minutes before trying again.',
  },
});

module.exports = {
  authLimiter,
  reportLimiter,
  uploadLimiter,
  triageLimiter,
};

