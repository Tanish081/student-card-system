import { sendError } from '../utils/apiResponse.js';

export const notFoundHandler = (req, res) => {
  sendError(res, `Route not found: ${req.originalUrl}`, 404);
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Centralized error response keeps controllers clean and consistent.
  sendError(res, message, statusCode, process.env.NODE_ENV === 'development' ? err.stack : null);
};
