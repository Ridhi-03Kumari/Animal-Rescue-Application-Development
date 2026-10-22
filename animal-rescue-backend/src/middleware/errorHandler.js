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
  } else if (err.name === 'MulterError') {
    status = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Image is too large. Maximum size is 10MB';
    } else {
      message = err.message;
    }
  } else if (/Only image files|Invalid MIME type|Invalid file extension/i.test(message)) {
    status = 400;
  } else if (err.type === 'entity.parse.failed' || (err instanceof SyntaxError && err.status === 400)) {
    status = 400;
    message = 'Request body is not valid JSON';
  } else if (err.message === 'Not allowed by CORS') {
    status = 403;
    message = 'Cross-Origin Request Blocked by CORS policy';
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
