import AcademicRecord from '../models/AcademicRecord.js';
import Achievement from '../models/Achievement.js';
import ParticipationRecord from '../models/ParticipationRecord.js';
import OpportunityApplication from '../models/OpportunityApplication.js';
import Student from '../models/Student.js';
import { ACHIEVEMENT_STATUS, PARTICIPATION_STATUS, SPI_CATEGORIES } from '../config/constants.js';
import { evaluateEligibility } from '../utils/schemeEligibility.js';

const clamp100 = (value) => Math.max(0, Math.min(100, value));

const normalizePointsToScore = (totalPoints, divisor = 150) => {
  if (!totalPoints) return 0;
  return clamp100((totalPoints / divisor) * 100);
};

const getCategoryLabel = (spi) =>
  SPI_CATEGORIES.find((item) => spi >= item.min && spi <= item.max)?.label || 'At Risk';

export const computeStudentSPI = async (studentUID, schoolId) => {
  const [student, academicRecords, approvedAchievements, approvedParticipation, selectedOpportunities] =
    await Promise.all([
      Student.findOne({ uid: studentUID, schoolId }).lean(),
    AcademicRecord.find({ studentUID, schoolId }).lean(),
    Achievement.find({
      studentUID,
      schoolId,
      status: ACHIEVEMENT_STATUS.APPROVED
    }).lean(),
    ParticipationRecord.find({
      studentUID,
      schoolId,
      status: PARTICIPATION_STATUS.APPROVED
      }).lean(),
      OpportunityApplication.find({
        schoolId,
        studentUID,
        status: { $in: ['shortlisted', 'selected'] }
      }).lean()
    ]);

  const academicScore = academicRecords.length
    ? clamp100(
        academicRecords.reduce((sum, rec) => sum + Number(rec.marks || 0), 0) / academicRecords.length
      )
    : 0;

  const sportsPoints = approvedAchievements
    .filter((item) => item.category?.toLowerCase() === 'sports')
    .reduce((sum, item) => sum + Number(item.points || 0), 0);

  const activityPoints = approvedAchievements
    .filter((item) => ['activity', 'extracurricular'].includes(item.category?.toLowerCase()))
    .reduce((sum, item) => sum + Number(item.points || 0), 0);

  const participationCount = approvedParticipation.length;

  const sportsScore = normalizePointsToScore(sportsPoints);
  const activityScore = normalizePointsToScore(activityPoints);
  const participationScore = clamp100(participationCount * 10);

  const academicPoints = clamp100(academicScore) * 4;
  const achievementPoints = Math.min(
    300,
    approvedAchievements.reduce((sum, item) => sum + Number(item.points || 0), 0)
  );
  const participationPoints = Math.min(200, approvedParticipation.length * 20);
  const opportunityPoints = Math.min(100, selectedOpportunities.length * 10);
  const spiTotal = Number(
    (academicPoints + achievementPoints + participationPoints + opportunityPoints).toFixed(2)
  );

  const spi = clamp100(
    Number(
      (
        0.45 * academicScore +
        0.3 * sportsScore +
        0.15 * activityScore +
        0.1 * participationScore
      ).toFixed(2)
    )
  );

  const totalCount = await Student.countDocuments({ schoolId });
  const betterCount = await Student.countDocuments({
    schoolId,
    spiTotal: { $gt: spiTotal }
  });
  const spiPercentile = totalCount > 0 ? Number((((totalCount - betterCount) / totalCount) * 100).toFixed(2)) : 0;

  const currentDate = new Date();
  const age = student?.dob ? Math.floor((Date.now() - new Date(student.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0;
  const eligibilityFlags = evaluateEligibility({
    spiTotal,
    category: student?.category,
    age,
    familyIncome: student?.familyIncome,
    achievementCount: approvedAchievements.length
  });

  await Student.updateOne(
    { uid: studentUID, schoolId },
    {
      $set: {
        pointsBreakdown: {
          academics: { score: Number(academicPoints.toFixed(2)), maxScore: 400, lastUpdated: currentDate },
          achievements: { score: Number(achievementPoints.toFixed(2)), maxScore: 300, lastUpdated: currentDate },
          participation: { score: Number(participationPoints.toFixed(2)), maxScore: 200, lastUpdated: currentDate },
          opportunities: { score: Number(opportunityPoints.toFixed(2)), maxScore: 100, lastUpdated: currentDate }
        },
        spiTotal,
        spiPercentile,
        eligibilityFlags
      }
    }
  );

  return {
    studentUID,
    academicScore: Number(academicScore.toFixed(2)),
    sportsScore: Number(sportsScore.toFixed(2)),
    activityScore: Number(activityScore.toFixed(2)),
    participationScore: Number(participationScore.toFixed(2)),
    spiTotal,
    spiPercentile,
    pointsBreakdown: {
      academics: { score: Number(academicPoints.toFixed(2)), maxScore: 400, lastUpdated: currentDate },
      achievements: { score: Number(achievementPoints.toFixed(2)), maxScore: 300, lastUpdated: currentDate },
      participation: { score: Number(participationPoints.toFixed(2)), maxScore: 200, lastUpdated: currentDate },
      opportunities: { score: Number(opportunityPoints.toFixed(2)), maxScore: 100, lastUpdated: currentDate }
    },
    eligibilityFlags,
    spi,
    category: getCategoryLabel(spi)
  };
};
