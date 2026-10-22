// Single source of truth for JWT configuration
const isProduction = process.env.NODE_ENV === 'production';
const rawSecret = process.env.JWT_SECRET;

const WEAK_SECRETS = new Set([
  'animal_rescue_dev_secret_key_2026',
  'secret',
  'jwt_secret',
  'password',
  'change_me',
  'changeme',
  '12345678',
  'default_secret',
  'your_jwt_secret',
  'your_secret_key',
  'your_jwt_secret_here',
  'your_secret_key_here_at_least_32_characters_long',
  'supersecretkey_please_change_this_in_production',
  'production_secret_key_placeholder_here',
]);

function validateProductionSecret(secret) {
  if (!secret || typeof secret !== 'string' || !secret.trim()) {
    throw new Error(
      '[FATAL SECURITY ERROR] JWT_SECRET environment variable is required in production. ' +
      'Please set a strong, random JWT_SECRET (at least 32 characters) in your environment.'
    );
  }

  const normalized = secret.trim();

  if (normalized.length < 32) {
    throw new Error(
      '[FATAL SECURITY ERROR] Provided JWT_SECRET is too short for production. ' +
      'Production JWT_SECRET must be at least 32 characters long.'
    );
  }

  if (WEAK_SECRETS.has(normalized.toLowerCase())) {
    throw new Error(
      '[FATAL SECURITY ERROR] Provided JWT_SECRET is a known weak/default placeholder. ' +
      'Production JWT_SECRET must not be a known default placeholder.'
    );
  }

  return normalized;
}

let jwtSecret = rawSecret;

if (isProduction) {
  jwtSecret = validateProductionSecret(rawSecret);
} else {
  if (!rawSecret || typeof rawSecret !== 'string' || !rawSecret.trim()) {
    console.warn(
      '[SECURITY WARNING] JWT_SECRET environment variable is not set. ' +
      'Using development fallback secret. NEVER use this in production.'
    );
    jwtSecret = 'animal_rescue_dev_secret_key_2026';
  }
}

module.exports = {
  JWT_SECRET: jwtSecret,
  validateProductionSecret,
  WEAK_SECRETS,
};
