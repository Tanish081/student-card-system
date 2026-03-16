import rateLimit from 'express-rate-limit';

export const publicVerifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many verification requests from this IP. Please try again in a minute.'
  }
});
