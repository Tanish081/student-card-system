import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendError } from '../utils/apiResponse.js';

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Not authorized, token missing', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).lean();

    if (!user) {
      return sendError(res, 'User no longer exists', 401);
    }

    req.user = user;
    req.schoolId = user.schoolId;
    return next();
  } catch (error) {
    return sendError(res, 'Invalid or expired token', 401);
  }
};
