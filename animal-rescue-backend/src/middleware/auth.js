const jwt = require('jsonwebtoken');

// Protect middleware - requires valid JWT
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated, token missing' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalid or expired' });
  }
};

// Optional protect middleware - allows guest users without token
const optionalProtect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      req.user = decoded;
    } catch (err) {
      // If invalid token provided, proceed as guest without req.user
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
};

// Role authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `User role '${req.user ? req.user.role : 'guest'}' is not authorized to access this route`,
      });
    }
    next();
  };
};

module.exports = {
  protect,
  optionalProtect,
  authorize,
};
