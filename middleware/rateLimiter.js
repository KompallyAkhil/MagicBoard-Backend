import rateLimit from 'express-rate-limit';

// Rate limiting configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  },
  keyGenerator: (req) => {
    // Use IP address as the key for rate limiting
    return req.ip;
  }
});

// More aggressive rate limiting for image generation
const imageGenerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // Limit each IP to 30 image generations per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many image generation requests. Please try again later.'
  },
  keyGenerator: (req) => req.ip,
});

export { apiLimiter, imageGenerationLimiter };
