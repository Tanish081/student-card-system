import Scheme from '../models/Scheme.js';
import Student from '../models/Student.js';
import AcademicRecord from '../models/AcademicRecord.js';
import Achievement from '../models/Achievement.js';
import ParticipationRecord from '../models/ParticipationRecord.js';
import { ACHIEVEMENT_STATUS, PARTICIPATION_STATUS } from '../config/constants.js';
import { computeStudentSPI } from './spiService.js';

const averageAcademicScore = (records) => {
  if (!records.length) return 0;
  const sum = records.reduce((acc, item) => acc + Number(item.marks || 0), 0);
  return Number((sum / records.length).toFixed(2));
};

const normalizeCategory = (value = '') => String(value).trim().toLowerCase();

const hasSportsProfile = ({ achievements, participation }) => {
  const sportsAchievement = achievements.some(
    (item) => normalizeCategory(item.category) === 'sports'
  );

  const sportsParticipation = participation.some(
    (item) => ['sports', 'athletics', 'physical'].includes(normalizeCategory(item.category))
  );

  return sportsAchievement || sportsParticipation;
};

const hasActivityProfile = ({ achievements, participation }) => {
  const activityAchievement = achievements.some((item) =>
    ['activity', 'extracurricular'].includes(normalizeCategory(item.category))
  );

  const participationExists = participation.length > 0;
  return activityAchievement || participationExists;
};

const evaluateScheme = ({ scheme, student, academicScore, spi, hasSports, hasActivity }) => {
  if (!scheme.active) return false;

  if (scheme.eligibleClasses?.length && !scheme.eligibleClasses.includes(String(student.class))) {
    return false;
  }

  if (Number(academicScore) < Number(scheme.minAcademicScore || 0)) {
    return false;
  }

  if (Number(spi) < Number(scheme.minSPI || 0)) {
    return false;
  }

  if (scheme.maxFamilyIncome !== null && scheme.maxFamilyIncome !== undefined) {
    if (student.familyIncome === null || student.familyIncome === undefined) return false;
    if (Number(student.familyIncome) > Number(scheme.maxFamilyIncome)) return false;
  }

  if (scheme.sportsRequired && !hasSports) {
    return false;
  }

  if (scheme.activityRequired && !hasActivity) {
    return false;
  }

  return true;
};

export const findEligibleSchemesForStudent = async ({ studentUID, schoolId }) => {
  const student = await Student.findOne({ uid: studentUID, schoolId }).lean();
  if (!student) {
    const error = new Error('Student not found');
    error.statusCode = 404;
    throw error;
  }

  const [schemes, academicRecords, approvedAchievements, approvedParticipation, spiBreakdown] =
    await Promise.all([
      Scheme.find({ schoolId, active: true }).lean(),
      AcademicRecord.find({ schoolId, studentUID }).lean(),
      Achievement.find({ schoolId, studentUID, status: ACHIEVEMENT_STATUS.APPROVED }).lean(),
      ParticipationRecord.find({
        schoolId,
        studentUID,
        status: PARTICIPATION_STATUS.APPROVED
      }).lean(),
      computeStudentSPI(studentUID, schoolId)
    ]);

  const academicScore = averageAcademicScore(academicRecords);
  const hasSports = hasSportsProfile({ achievements: approvedAchievements, participation: approvedParticipation });
  const hasActivity = hasActivityProfile({ achievements: approvedAchievements, participation: approvedParticipation });

  const eligibleSchemes = schemes.filter((scheme) =>
    evaluateScheme({
      scheme,
      student,
      academicScore,
      spi: spiBreakdown.spi,
      hasSports,
      hasActivity
    })
  );

  return {
    studentUID,
    academicScore,
    spi: spiBreakdown.spi,
    hasSports,
    hasActivity,
    eligibleSchemes
  };
};
