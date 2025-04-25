import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define log levels
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Get current environment
const environment = process.env.NODE_ENV || 'development';

// Set minimum log level based on environment
const minimumLogLevel = environment === 'production' 
  ? LogLevel.INFO  // In production, only log INFO and above
  : LogLevel.DEBUG; // In development, log everything

// Sensitive fields that should be redacted
const sensitiveFields = [
  'password',
  'passwordHash',
  'token',
  'secret',
  'credit_card',
  'cardNumber',
  'cvv',
  'ssn',
  'socialSecurity',
  'auth',
  'authorization',
  'stripe',
  'key',
  'stripePaymentId',
  'client_secret',
  'clientSecret',
];

/**
 * Sanitize an object by redacting sensitive information
 */
function sanitizeObject(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Check if this key contains any sensitive information
    const isSensitive = sensitiveFields.some(field => 
      key.toLowerCase().includes(field.toLowerCase())
    );

    if (isSensitive) {
      // Redact sensitive information
      sanitized[key] = typeof value === 'string' 
        ? '[REDACTED]' 
        : typeof value === 'number' 
          ? 0 
          : '[REDACTED]';
    } else if (value && typeof value === 'object') {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeObject(value);
    } else {
      // Copy non-sensitive values as is
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Format and output a log message
 */
function logMessage(level: LogLevel, message: string, meta?: any): void {
  // Skip if below minimum log level
  if (level < minimumLogLevel) {
    return;
  }

  const timestamp = new Date().toISOString();
  const levelName = LogLevel[level];
  
  // Format the message
  let logData: any = {
    timestamp,
    level: levelName,
    message,
  };

  // Add metadata if provided
  if (meta) {
    logData.meta = sanitizeObject(meta);
  }

  // In production, format as JSON for easier log processing
  if (environment === 'production') {
    console.log(JSON.stringify(logData));
  } else {
    // In development, use colorized console output
    const colors = {
      DEBUG: '\x1b[34m', // Blue
      INFO: '\x1b[32m',  // Green
      WARN: '\x1b[33m',  // Yellow
      ERROR: '\x1b[31m', // Red
      RESET: '\x1b[0m',  // Reset
    };

    console.log(
      `${colors[levelName]}[${timestamp}] ${levelName}:${colors.RESET} ${message}`,
      meta ? sanitizeObject(meta) : ''
    );
  }
}

// Export logger functions
export const logger = {
  debug: (message: string, meta?: any) => logMessage(LogLevel.DEBUG, message, meta),
  info: (message: string, meta?: any) => logMessage(LogLevel.INFO, message, meta),
  warn: (message: string, meta?: any) => logMessage(LogLevel.WARN, message, meta),
  error: (message: string, meta?: any) => logMessage(LogLevel.ERROR, message, meta),
};

export default logger; 