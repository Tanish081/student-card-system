import User from '../models/User.js';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';
import { ROLES } from '../config/constants.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';
import { signToken } from '../services/tokenService.js';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, teacherID, studentUID } = req.body;
  const schoolId = req.schoolId || process.env.DEFAULT_SCHOOL_ID || 'SCH001';

  if (!name || !email || !password || !role) {
    return sendError(res, 'name, email, password, and role are required', 400);
  }

  if (!Object.values(ROLES).includes(role)) {
    return sendError(res, 'Invalid role provided', 400);
  }

  const existingUser = await User.findOne({ email: email.toLowerCase(), schoolId });
  if (existingUser) {
    return sendError(res, 'User with this email already exists', 409);
  }

  const userPayload = {
    schoolId,
    name,
    email,
    password,
    role
  };

  if (role === ROLES.TEACHER) {
    if (!teacherID) return sendError(res, 'teacherID is required for teacher registration', 400);
    userPayload.linkedTeacherID = teacherID;
  }

  if (role === ROLES.STUDENT) {
    if (!studentUID) return sendError(res, 'studentUID is required for student registration', 400);

    const student = await Student.findOne({ uid: studentUID, schoolId });
    if (!student) return sendError(res, 'Student record not found for provided studentUID', 404);

    userPayload.linkedStudentUID = studentUID;
  }

  const user = await User.create(userPayload);

  if (role === ROLES.TEACHER) {
    await Teacher.findOneAndUpdate(
      { teacherID, schoolId },
      {
        teacherID,
        schoolId,
        name,
        email,
        userId: user._id
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  if (role === ROLES.STUDENT) {
    await Student.findOneAndUpdate(
      { uid: studentUID, schoolId },
      { userId: user._id },
      { new: true }
    );
  }

  const token = signToken({
    id: user._id,
    role: user.role,
    schoolId: user.schoolId
  });

  return sendSuccess(
    res,
    'Registration successful',
    {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        linkedTeacherID: user.linkedTeacherID,
        linkedStudentUID: user.linkedStudentUID
      }
    },
    201
  );
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const schoolId = process.env.DEFAULT_SCHOOL_ID || 'SCH001';

  if (!email || !password) {
    return sendError(res, 'email and password are required', 400);
  }

  const user = await User.findOne({ email: email.toLowerCase(), schoolId }).select('+password');
  if (!user) {
    return sendError(res, 'Invalid credentials', 401);
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return sendError(res, 'Invalid credentials', 401);
  }

  const token = signToken({
    id: user._id,
    role: user.role,
    schoolId: user.schoolId
  });

  let profileCompletionRequired = false;
  if (user.role === ROLES.STUDENT && user.linkedStudentUID) {
    const student = await Student.findOne({
      schoolId: user.schoolId,
      uid: user.linkedStudentUID
    })
      .select('profileCompleted')
      .lean();

    profileCompletionRequired = !student?.profileCompleted;
  }

  return sendSuccess(res, 'Login successful', {
    token,
    profileCompletionRequired,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      linkedTeacherID: user.linkedTeacherID,
      linkedStudentUID: user.linkedStudentUID
    }
  });
});
