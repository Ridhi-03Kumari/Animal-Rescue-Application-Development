// Single source of truth for the JWT secret, so tokens signed by the auth controller
// are always verified with the same secret by the auth middleware.
module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'animal_rescue_dev_secret_key_2026',
};
