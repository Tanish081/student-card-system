import Student from '../models/Student.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';
import { computeStudentSPI } from '../services/spiService.js';

export const getStudentSPI = asyncHandler(async (req, res) => {
  const { uid } = req.params;
  const schoolId = req.schoolId;

  const student = await Student.findOne({ uid, schoolId }).lean();
  if (!student) return sendError(res, 'Student not found', 404);

  if (req.user.role === 'student' && req.user.linkedStudentUID !== uid) {
    return sendError(res, 'You can only view your own SPI', 403);
  }

  const spi = await computeStudentSPI(uid, schoolId);
  return sendSuccess(res, 'Student SPI fetched successfully', spi);
});

export const getClassSPIRanking = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const schoolId = req.schoolId;

  const normalizedClass = String(classId).toUpperCase();
  const classNumber = normalizedClass.replace(/[^0-9]/g, '');
  const section = normalizedClass.replace(/[0-9]/g, '');

  const students = await Student.find({
    schoolId,
    class: classNumber,
    section
  }).lean();

  const ranking = await Promise.all(
    students.map(async (student) => {
      const spiData = await computeStudentSPI(student.uid, schoolId);
      return {
        uid: student.uid,
        name: student.name,
        class: `${student.class}${student.section}`,
        spi: spiData.spi,
        category: spiData.category
      };
    })
  );

  ranking.sort((a, b) => b.spi - a.spi);

  return sendSuccess(res, 'Class SPI ranking fetched successfully', {
    class: normalizedClass,
    count: ranking.length,
    ranking
  });
});
