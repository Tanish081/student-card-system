import Student from '../models/Student.js';
import AcademicRecord from '../models/AcademicRecord.js';
import Achievement from '../models/Achievement.js';
import ParticipationRecord from '../models/ParticipationRecord.js';
import { ACHIEVEMENT_STATUS } from '../config/constants.js';
import { computeStudentSPI } from '../services/spiService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

const getTopItems = (items, key, limit = 5) =>
  [...items].sort((a, b) => b[key] - a[key]).slice(0, limit);

const buildPrincipalAnalytics = async (schoolId) => {
  const [students, approvedAchievements, academicRecords, approvedParticipation] = await Promise.all([
    Student.find({ schoolId }).lean(),
    Achievement.find({ schoolId, status: ACHIEVEMENT_STATUS.APPROVED }).lean(),
    AcademicRecord.find({ schoolId }).lean(),
    ParticipationRecord.find({ schoolId, status: 'Approved' }).lean()
  ]);

  const spiRanking = await Promise.all(
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

  spiRanking.sort((a, b) => b.spi - a.spi);

  const marksByStudent = academicRecords.reduce((acc, item) => {
    if (!acc[item.studentUID]) acc[item.studentUID] = [];
    acc[item.studentUID].push(Number(item.marks));
    return acc;
  }, {});

  const academicLeaders = getTopItems(
    students.map((student) => {
      const marks = marksByStudent[student.uid] || [];
      const average = marks.length ? marks.reduce((s, m) => s + m, 0) / marks.length : 0;
      return {
        uid: student.uid,
        name: student.name,
        class: `${student.class}${student.section}`,
        averageMarks: Number(average.toFixed(2))
      };
    }),
    'averageMarks'
  );

  const sportsPointsByStudent = approvedAchievements
    .filter((item) => item.category?.toLowerCase() === 'sports')
    .reduce((acc, item) => {
      acc[item.studentUID] = (acc[item.studentUID] || 0) + Number(item.points || 0);
      return acc;
    }, {});

  const sportsLeaders = getTopItems(
    students.map((student) => ({
      uid: student.uid,
      name: student.name,
      class: `${student.class}${student.section}`,
      sportsPoints: Number((sportsPointsByStudent[student.uid] || 0).toFixed(2))
    })),
    'sportsPoints'
  );

  const participationStatistics = students.reduce((acc, student) => {
    const cls = `${student.class}${student.section}`;
    if (!acc[cls]) acc[cls] = { class: cls, studentCount: 0, participationEntries: 0 };
    acc[cls].studentCount += 1;
    return acc;
  }, {});

  approvedParticipation.forEach((item) => {
    const student = students.find((s) => s.uid === item.studentUID);
    if (!student) return;
    const cls = `${student.class}${student.section}`;
    if (participationStatistics[cls]) {
      participationStatistics[cls].participationEntries += 1;
    }
  });

  const studentsNeedingSupport = spiRanking.filter((item) => item.spi < 60);

  return {
    totalStudents: students.length,
    spiRanking,
    academicLeaders,
    sportsLeaders,
    participationStatistics: Object.values(participationStatistics),
    studentsNeedingSupport
  };
};

export const getPrincipalAnalytics = asyncHandler(async (req, res) => {
  const schoolId = req.schoolId;

  return sendSuccess(res, 'Principal analytics fetched successfully', await buildPrincipalAnalytics(schoolId));
});

export const getPrincipalSPI = asyncHandler(async (req, res) => {
  const analytics = await buildPrincipalAnalytics(req.schoolId);
  return sendSuccess(res, 'Principal SPI ranking fetched successfully', {
    spiRanking: analytics.spiRanking,
    studentsNeedingSupport: analytics.studentsNeedingSupport
  });
});

export const getPrincipalTopStudents = asyncHandler(async (req, res) => {
  const analytics = await buildPrincipalAnalytics(req.schoolId);
  return sendSuccess(res, 'Principal top students fetched successfully', {
    topSPIStudents: analytics.spiRanking.slice(0, 10),
    academicLeaders: analytics.academicLeaders,
    sportsLeaders: analytics.sportsLeaders
  });
});
