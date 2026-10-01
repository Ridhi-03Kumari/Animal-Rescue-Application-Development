// Unknown API routes return JSON instead of Express's default HTML page
const notFound = (req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
};

const errorHandler = (err, req, res, next) => {
  // Bad ids / invalid data from the client are client errors, not server crashes
  let status = err.statusCode || err.status || 500;
  let message = err.message || 'Server error';

  if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path || 'id'}: ${err.value}`;
  } else if (err.name === 'ValidationError') {
    status = 400;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Request body is not valid JSON';
  } else if (/before initial connection is complete|buffering timed out/i.test(message)) {
    // A code path that needs MongoDB was reached while the database is offline
    status = 503;
    message = 'This feature needs the database, which is not connected right now.';
  }

  if (status >= 500) {
    console.error(err.stack);
  }

  res.status(status).json({ error: message });
};

module.exports = errorHandler;
module.exports.notFound = notFound;
