/**
 * Utility to sanitize sensitive data from logs
 *
 * Prevents accidental logging of:
 * - API tokens
 * - Passwords
 * - PII (Personally Identifiable Information)
 * - Full request bodies with sensitive data
 */

/**
 * Patterns to detect and redact sensitive data
 */
const SENSITIVE_PATTERNS = [
  // API tokens (various formats)
  { pattern: /pk_[a-zA-Z0-9_-]{20,}/g, replacement: 'pk_***REDACTED***' },
  { pattern: /sk-[a-zA-Z0-9]{20,}/g, replacement: 'sk-***REDACTED***' },
  { pattern: /Bearer\s+[a-zA-Z0-9._-]+/gi, replacement: 'Bearer ***REDACTED***' },

  // Email addresses (simple pattern)
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '***@***.***' },

  // Phone numbers (basic US format)
  { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, replacement: '***-***-****' },

  // SSN format
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '***-**-****' },

  // Credit card numbers (basic pattern)
  { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: '****-****-****-****' },
];

/**
 * Keys that should be redacted entirely
 */
const SENSITIVE_KEYS = [
  'password',
  'token',
  'apikey',
  'api_key',
  'secret',
  'authorization',
  'clickuptoken',
  'clickup_token',
];

/**
 * Sanitize a string by redacting sensitive patterns
 */
export function sanitizeString(input: string): string {
  let sanitized = input;

  for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, replacement);
  }

  return sanitized;
}

/**
 * Sanitize an object by redacting sensitive keys and values
 * Creates a deep copy to avoid mutating the original
 */
export function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle primitives
  if (typeof obj !== 'object') {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  // Handle objects
  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    // Check if key is sensitive
    if (SENSITIVE_KEYS.some(sensitiveKey => lowerKey.includes(sensitiveKey))) {
      sanitized[key] = '***REDACTED***';
      continue;
    }

    // Recursively sanitize nested objects/arrays
    sanitized[key] = sanitizeObject(value);
  }

  return sanitized;
}

/**
 * Safe console.log that sanitizes sensitive data
 * Use this instead of console.log for request/response logging
 */
export function safeLog(message: string, data?: any): void {
  if (data) {
    console.log(message, sanitizeObject(data));
  } else {
    console.log(sanitizeString(message));
  }
}

/**
 * Safe console.error that sanitizes sensitive data
 * Use this instead of console.error
 */
export function safeError(message: string, error?: any): void {
  if (error) {
    // Don't sanitize error stack traces, but sanitize error messages
    if (error instanceof Error) {
      console.error(message, {
        name: error.name,
        message: sanitizeString(error.message),
        stack: error.stack, // Keep stack trace for debugging
      });
    } else {
      console.error(message, sanitizeObject(error));
    }
  } else {
    console.error(sanitizeString(message));
  }
}

/**
 * Truncate long text for logging (e.g., RFP content)
 * Keeps first N and last N characters with indication of truncation
 */
export function truncateForLog(text: string, maxLength: number = 200): string {
  if (text.length <= maxLength) {
    return text;
  }

  const halfLength = Math.floor((maxLength - 20) / 2);
  const start = text.substring(0, halfLength);
  const end = text.substring(text.length - halfLength);

  return `${start}...[${text.length - maxLength} chars truncated]...${end}`;
}
