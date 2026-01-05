/**
 * Centralized error handling middleware
 * CRASH-SAFE: Always returns valid JSON error response
 * Never exposes stack traces to client
 */

/**
 * Error handler middleware
 * Catches all errors and returns standardized JSON error responses
 */
function errorHandler(err, req, res, next) {
  try {
    // Log error for debugging (console only, never expose to client)
    console.error('Error:', {
      message: err.message || 'Unknown error',
      path: req.path,
      method: req.method
    });

    // Determine status code
    const statusCode = err.statusCode || err.status || 500;

    // Always return clean error message to client
    // Never expose stack traces or internal error details
    res.status(statusCode).json({
      error: 'Something went wrong. Please try again.'
    });
  } catch (handlerError) {
    // Even error handler failed - return minimal response
    console.error('Error handler itself failed:', handlerError.message);
    res.status(500).json({
      error: 'Something went wrong. Please try again.'
    });
  }
}

/**
 * Creates a custom API error
 */
function createError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

/**
 * Async error wrapper to catch errors in async route handlers
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // Ensure error has statusCode
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
  };
}

module.exports = errorHandler;
module.exports.createError = createError;
module.exports.asyncHandler = asyncHandler;

