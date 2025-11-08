import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

// Define transports
const transports = [
  // Console transport (always enabled in development)
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? format : consoleFormat,
  }),
];

// Add file transports only in production or if LOG_TO_FILE is true
if (process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true') {
  const logsDir = process.env.LOGS_DIR || path.join(__dirname, '../../logs');

  // Error logs - separate file for errors only
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      format: format,
    })
  );

  // Combined logs - all levels
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: format,
    })
  );

  // HTTP logs - for request/response tracking
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'http-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      maxSize: '20m',
      maxFiles: '7d',
      format: format,
    })
  );

  // XRPL transaction logs - for blockchain operations
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'xrpl-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d', // Keep XRPL logs longer
      format: format,
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  // Don't exit on error
  exitOnError: false,
});

/**
 * Custom logging methods for specific contexts
 */

// Log XRPL transactions
logger.xrpl = (operation, data) => {
  logger.info('XRPL Operation', {
    category: 'xrpl',
    operation,
    ...data,
    timestamp: new Date().toISOString(),
  });
};

// Log authentication events
logger.auth = (event, data) => {
  logger.info('Auth Event', {
    category: 'auth',
    event,
    ...data,
    timestamp: new Date().toISOString(),
  });
};

// Log payment operations
logger.payment = (type, data) => {
  logger.info('Payment Operation', {
    category: 'payment',
    type,
    ...data,
    timestamp: new Date().toISOString(),
  });
};

// Log security events
logger.security = (event, data) => {
  logger.warn('Security Event', {
    category: 'security',
    event,
    ...data,
    timestamp: new Date().toISOString(),
  });
};

// Log API requests (for morgan integration)
logger.http = (message, meta = {}) => {
  logger.log('http', message, {
    category: 'http',
    ...meta,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Stream for Morgan HTTP logger
 */
logger.stream = {
  write: (message) => {
    // Remove trailing newline
    logger.http(message.trim());
  },
};

export default logger;
