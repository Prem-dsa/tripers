const errorHandler = (err, req, res, next) => {
  console.error('🔴 API Error:', err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose connection / buffering timeout
  if (err.name === 'MongooseError' || err.name === 'MongooseServerSelectionError' || err.message?.includes('buffering timed out')) {
    message = 'Database connection error. Please ensure MongoDB is running at mongodb://127.0.0.1:27017/tripers.';
    statusCode = 503;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'Field';
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    statusCode = 409;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map((e) => e.message).join(', ');
    statusCode = 400;
  }

  // Mongoose CastError
  if (err.name === 'CastError') {
    message = `Invalid ${err.path}: ${err.value}`;
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
