export const sendSuccess = (res, message, data = {}, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const mapDefaultErrorCode = (statusCode) => {
  if (statusCode === 400) return 'BAD_REQUEST';
  if (statusCode === 401) return 'UNAUTHORIZED';
  if (statusCode === 403) return 'FORBIDDEN';
  if (statusCode === 404) return 'NOT_FOUND';
  if (statusCode === 409) return 'CONFLICT';
  if (statusCode >= 500) return 'INTERNAL_SERVER_ERROR';
  return 'ERROR';
};

export const sendError = (res, message, statusCode = 400, errors = null, errorCode = null) => {
  res.status(statusCode).json({
    success: false,
    message,
    errorCode: errorCode || mapDefaultErrorCode(statusCode),
    errors
  });
};
