const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for password reset endpoints
 * Limits: 5 requests per 15 minutes per IP
 * This prevents brute force attacks and abuse of the password reset functionality
 */
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    status: 'error',
    message: 'Too many password reset attempts from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for successful requests (optional - comment out if you want to count all requests)
  skipSuccessfulRequests: false,
  // Skip rate limiting for failed requests (optional)
  skipFailedRequests: false,
  // Custom handler for when limit is exceeded
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many password reset attempts from this IP. Please try again after 15 minutes.',
      retryAfter: '15 minutes'
    });
  }
});

module.exports = {
  passwordResetLimiter
};
