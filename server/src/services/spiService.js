import AcademicRecord from '../models/AcademicRecord.js';
import Achievement from '../models/Achievement.js';
import ParticipationRecord from '../models/ParticipationRecord.js';
import { ACHIEVEMENT_STATUS, PARTICIPATION_STATUS, SPI_CATEGORIES } from '../config/constants.js';

const clamp100 = (value) => Math.max(0, Math.min(100, value));

const normalizePointsToScore = (totalPoints, divisor = 150) => {
  if (!totalPoints) return 0;
  return clamp100((totalPoints / divisor) * 100);
};

const getCategoryLabel = (spi) =>
  SPI_CATEGORIES.find((item) => spi >= item.min && spi <= item.max)?.label || 'At Risk';

export const computeStudentSPI = async (studentUID, schoolId) => {
  const [academicRecords, approvedAchievements, approvedParticipation] = await Promise.all([
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

  return {
    studentUID,
    academicScore: Number(academicScore.toFixed(2)),
    sportsScore: Number(sportsScore.toFixed(2)),
    activityScore: Number(activityScore.toFixed(2)),
    participationScore: Number(participationScore.toFixed(2)),
    spi,
    category: getCategoryLabel(spi)
  };
};
