// Security configuration for AppFounders platform
export const SECURITY_CONFIG = {
  // Rate limiting configuration
  RATE_LIMITS: {
    API: {
      REQUESTS_PER_WINDOW: 100,
      WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    },
    BOT: {
      REQUESTS_PER_WINDOW: 10,
      WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    },
    AUTH: {
      LOGIN_ATTEMPTS: 5,
      WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    },
    UPLOAD: {
      REQUESTS_PER_WINDOW: 20,
      WINDOW_MS: 60 * 60 * 1000, // 1 hour
    },
  },

  // Content Security Policy
  CSP: {
    DEFAULT_SRC: ["'self'"],
    SCRIPT_SRC: [
      "'self'",
      "'unsafe-eval'",
      "'unsafe-inline'",
      "https://js.stripe.com",
      "https://www.google-analytics.com",
      "https://www.googletagmanager.com",
    ],
    STYLE_SRC: [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com",
    ],
    FONT_SRC: [
      "'self'",
      "https://fonts.gstatic.com",
    ],
    IMG_SRC: [
      "'self'",
      "data:",
      "https:",
      "blob:",
    ],
    MEDIA_SRC: [
      "'self'",
      "https:",
    ],
    CONNECT_SRC: [
      "'self'",
      "https://api.stripe.com",
      "https://www.google-analytics.com",
      "wss:",
    ],
    FRAME_SRC: [
      "'self'",
      "https://js.stripe.com",
      "https://hooks.stripe.com",
    ],
    OBJECT_SRC: ["'none'"],
    BASE_URI: ["'self'"],
    FORM_ACTION: ["'self'"],
    FRAME_ANCESTORS: ["'none'"],
    UPGRADE_INSECURE_REQUESTS: true,
  },

  // File upload security
  UPLOAD: {
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    ALLOWED_MIME_TYPES: [
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Documents
      'application/pdf',
      'text/plain',
      'text/markdown',
      // Archives
      'application/zip',
      'application/x-zip-compressed',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      // Executables (for app distribution)
      'application/octet-stream',
      'application/x-msdownload',
      'application/x-msdos-program',
      'application/x-executable',
    ],
    SCAN_FOR_MALWARE: true,
    QUARANTINE_SUSPICIOUS: true,
  },

  // Password requirements
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: true,
    FORBIDDEN_PATTERNS: [
      'password',
      '123456',
      'qwerty',
      'admin',
      'user',
    ],
  },

  // Session security
  SESSION: {
    MAX_AGE: 24 * 60 * 60, // 24 hours
    SECURE: process.env.NODE_ENV === 'production',
    HTTP_ONLY: true,
    SAME_SITE: 'strict' as const,
    ROLLING: true,
  },

  // API security
  API: {
    REQUIRE_API_KEY: true,
    VALIDATE_ORIGIN: true,
    ALLOWED_ORIGINS: [
      'https://appfounders.com',
      'https://www.appfounders.com',
      'https://api.appfounders.com',
    ],
    WEBHOOK_TIMEOUT: 30000, // 30 seconds
  },

  // Input validation
  VALIDATION: {
    MAX_STRING_LENGTH: 10000,
    MAX_ARRAY_LENGTH: 1000,
    MAX_OBJECT_DEPTH: 10,
    SANITIZE_HTML: true,
    STRIP_DANGEROUS_TAGS: true,
  },

  // Monitoring and alerting
  MONITORING: {
    LOG_FAILED_ATTEMPTS: true,
    ALERT_THRESHOLD: 10, // Failed attempts before alert
    BLOCK_THRESHOLD: 50, // Failed attempts before temporary block
    BLOCK_DURATION: 60 * 60 * 1000, // 1 hour
  },
} as const;

// Security headers configuration
export const SECURITY_HEADERS = {
  // HTTPS enforcement
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // XSS Protection
  'X-XSS-Protection': '1; mode=block',
  
  // Content Type Options
  'X-Content-Type-Options': 'nosniff',
  
  // Frame Options
  'X-Frame-Options': 'DENY',
  
  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions Policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=(self)',
    'usb=()',
    'magnetometer=()',
    'accelerometer=()',
    'gyroscope=()',
  ].join(', '),
  
  // Cross-Origin Policies
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
} as const;

// Generate CSP header value
export function generateCSPHeader(): string {
  const csp = SECURITY_CONFIG.CSP;
  
  const directives = [
    `default-src ${csp.DEFAULT_SRC.join(' ')}`,
    `script-src ${csp.SCRIPT_SRC.join(' ')}`,
    `style-src ${csp.STYLE_SRC.join(' ')}`,
    `font-src ${csp.FONT_SRC.join(' ')}`,
    `img-src ${csp.IMG_SRC.join(' ')}`,
    `media-src ${csp.MEDIA_SRC.join(' ')}`,
    `connect-src ${csp.CONNECT_SRC.join(' ')}`,
    `frame-src ${csp.FRAME_SRC.join(' ')}`,
    `object-src ${csp.OBJECT_SRC.join(' ')}`,
    `base-uri ${csp.BASE_URI.join(' ')}`,
    `form-action ${csp.FORM_ACTION.join(' ')}`,
    `frame-ancestors ${csp.FRAME_ANCESTORS.join(' ')}`,
  ];
  
  if (csp.UPGRADE_INSECURE_REQUESTS) {
    directives.push('upgrade-insecure-requests');
  }
  
  return directives.join('; ');
}

// Malicious pattern detection
export const MALICIOUS_PATTERNS = [
  // XSS patterns
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
  
  // Path traversal
  /\.\.\//g,
  /\.\.\\\\g,
  /\.\.\%2f/gi,
  /\.\.\%5c/gi,
  
  // SQL injection
  /union\s+select/gi,
  /drop\s+table/gi,
  /insert\s+into/gi,
  /delete\s+from/gi,
  /update\s+set/gi,
  /exec\s*\(/gi,
  /execute\s*\(/gi,
  
  // Command injection
  /;\s*rm\s+/gi,
  /;\s*cat\s+/gi,
  /;\s*ls\s+/gi,
  /;\s*pwd/gi,
  /;\s*whoami/gi,
  /\|\s*nc\s+/gi,
  /\|\s*netcat\s+/gi,
  
  // LDAP injection
  /\(\|\(/gi,
  /\)\(\|/gi,
  /\*\)\(/gi,
  
  // NoSQL injection
  /\$where/gi,
  /\$ne/gi,
  /\$gt/gi,
  /\$lt/gi,
] as const;

// Bot detection patterns
export const BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
  /postman/i,
  /insomnia/i,
  /httpie/i,
  /axios/i,
  /fetch/i,
] as const;

// Suspicious user agent patterns
export const SUSPICIOUS_UA_PATTERNS = [
  /sqlmap/i,
  /nikto/i,
  /nmap/i,
  /masscan/i,
  /zap/i,
  /burp/i,
  /w3af/i,
  /skipfish/i,
  /wpscan/i,
  /dirb/i,
  /dirbuster/i,
  /gobuster/i,
] as const;

// Security utility functions
export const SecurityUtils = {
  // Check if request is from a bot
  isBot(userAgent: string): boolean {
    return BOT_PATTERNS.some(pattern => pattern.test(userAgent));
  },
  
  // Check if request is suspicious
  isSuspicious(userAgent: string): boolean {
    return SUSPICIOUS_UA_PATTERNS.some(pattern => pattern.test(userAgent));
  },
  
  // Validate input against malicious patterns
  containsMaliciousContent(input: string): boolean {
    return MALICIOUS_PATTERNS.some(pattern => pattern.test(input));
  },
  
  // Generate secure random string
  generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
  
  // Sanitize filename
  sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 255);
  },
  
  // Validate file type
  isAllowedFileType(mimeType: string): boolean {
    return SECURITY_CONFIG.UPLOAD.ALLOWED_MIME_TYPES.includes(mimeType);
  },
  
  // Check password strength
  isStrongPassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config = SECURITY_CONFIG.PASSWORD;
    
    if (password.length < config.MIN_LENGTH) {
      errors.push(`Password must be at least ${config.MIN_LENGTH} characters long`);
    }
    
    if (password.length > config.MAX_LENGTH) {
      errors.push(`Password must be no more than ${config.MAX_LENGTH} characters long`);
    }
    
    if (config.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (config.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (config.REQUIRE_NUMBERS && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (config.REQUIRE_SPECIAL_CHARS && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    const lowerPassword = password.toLowerCase();
    for (const pattern of config.FORBIDDEN_PATTERNS) {
      if (lowerPassword.includes(pattern)) {
        errors.push(`Password cannot contain "${pattern}"`);
        break;
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  },
} as const;
