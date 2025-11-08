import logger from '../utils/logger.js';

/**
 * Request logging middleware
 * Logs detailed information about each HTTP request
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log request
  logger.http('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: req.user?.id,
    userRole: req.user?.role,
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - startTime;

    // Log response
    logger.http('Response sent', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id,
      contentLength: res.get('content-length'),
    });

    // Log errors separately
    if (res.statusCode >= 400) {
      logger.warn('Request failed', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userId: req.user?.id,
        ip: req.ip || req.connection.remoteAddress,
      });
    }

    originalSend.call(this, data);
  };

  next();
};

/**
 * Error logging middleware
 * Logs detailed information about errors
 */
export const errorLogger = (err, req, res, next) => {
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    userId: req.user?.id,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    body: req.body,
    params: req.params,
    query: req.query,
  });

  next(err);
};
