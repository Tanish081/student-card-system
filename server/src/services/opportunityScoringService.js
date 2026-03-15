import AcademicRecord from '../models/AcademicRecord.js';
import Achievement from '../models/Achievement.js';
import ParticipationRecord from '../models/ParticipationRecord.js';
import Opportunity from '../models/Opportunity.js';
import { ACHIEVEMENT_STATUS, PARTICIPATION_STATUS } from '../config/constants.js';
import { computeStudentSPI } from './spiService.js';

const clamp100 = (value) => Math.max(0, Math.min(100, Number(value) || 0));
const normalize = (value) => String(value || '').trim().toLowerCase();

const CATEGORY_SKILL_HINTS = {
  science: ['logic', 'problem-solving', 'research'],
  technology: ['coding', 'problem-solving', 'strategy'],
  sports: ['athletics', 'strategy', 'discipline'],
  arts: ['creativity', 'design', 'expression'],
  mathematics: ['logic', 'problem-solving', 'analysis'],
  debate: ['communication', 'reasoning', 'strategy'],
  robotics: ['coding', 'logic', 'problem-solving'],
  music: ['creativity', 'rhythm', 'practice']
};

const CATEGORY_SUBJECT_HINTS = {
  science: ['science', 'physics', 'chemistry', 'biology'],
  technology: ['computer', 'informatics', 'it'],
  sports: ['physical', 'sports'],
  arts: ['art', 'fine arts', 'drawing'],
  mathematics: ['math', 'mathematics'],
  debate: ['english', 'language', 'social science'],
  robotics: ['computer', 'science', 'math', 'mathematics'],
  music: ['music']
};

const toNormalizedSet = (values = []) => {
  const set = new Set();
  for (const value of values) {
    const next = normalize(value);
    if (next) set.add(next);
  }
  return set;
};

const overlapPercent = (baseSet, targetSet) => {
  if (!baseSet.size) return 50;
  let overlap = 0;
  baseSet.forEach((item) => {
    if (targetSet.has(item)) overlap += 1;
  });
  return clamp100((overlap / baseSet.size) * 100);
};

const buildCategoryStats = ({ achievements, participation }) => {
  const stats = new Map();

  achievements.forEach((item) => {
    const key = normalize(item.category);
    if (!key) return;
    const next = stats.get(key) || { points: 0, achievements: 0, participation: 0 };
    next.points += Number(item.points || 0);
    next.achievements += 1;
    stats.set(key, next);
  });

  participation.forEach((item) => {
    const key = normalize(item.category);
    if (!key) return;
    const next = stats.get(key) || { points: 0, achievements: 0, participation: 0 };
    next.participation += 1;
    stats.set(key, next);
  });

  return stats;
};

const computeAcademicCategoryScore = (academicRecords, category) => {
  const subjectHints = CATEGORY_SUBJECT_HINTS[category] || [];
  if (!subjectHints.length) return 50;

  const matched = academicRecords.filter((record) => {
    const subject = normalize(record.subject);
    return subjectHints.some((hint) => subject.includes(hint));
  });

  if (!matched.length) return 50;

  const average = matched.reduce((sum, item) => sum + Number(item.marks || 0), 0) / matched.length;
  return clamp100(average);
};

export const expireOutdatedOpportunities = async (schoolId) => {
  await Opportunity.updateMany(
    {
      schoolId,
      status: 'active',
      deadline: { $lt: new Date() }
    },
    {
      $set: { status: 'expired' }
    }
  );
};

export const buildStudentOpportunityContext = async ({ student, schoolId }) => {
  const studentUID = student.uid;

  const [spiBreakdown, achievements, participation, academicRecords] = await Promise.all([
    computeStudentSPI(studentUID, schoolId),
    Achievement.find({
      schoolId,
      studentUID,
      status: ACHIEVEMENT_STATUS.APPROVED
    }).lean(),
    ParticipationRecord.find({
      schoolId,
      studentUID,
      status: PARTICIPATION_STATUS.APPROVED
    }).lean(),
    AcademicRecord.find({ schoolId, studentUID }).lean()
  ]);

  const studentInterests = toNormalizedSet(student.interests || []);
  const inferredInterests = new Set([
    ...achievements.map((item) => normalize(item.category)),
    ...participation.map((item) => normalize(item.category))
  ]);

  const mergedInterests = new Set([...studentInterests, ...inferredInterests]);

  const inferredSkills = new Set();
  mergedInterests.forEach((interest) => {
    (CATEGORY_SKILL_HINTS[interest] || []).forEach((tag) => inferredSkills.add(normalize(tag)));
  });

  studentInterests.forEach((interest) => inferredSkills.add(normalize(interest)));

  const categoryStats = buildCategoryStats({ achievements, participation });

  return {
    student,
    spiBreakdown,
    achievements,
    participation,
    academicRecords,
    interests: mergedInterests,
    skills: inferredSkills,
    categoryStats
  };
};

export const scoreOpportunityForStudent = ({ opportunity, context }) => {
  const category = normalize(opportunity.category);
  const opportunitySkills = toNormalizedSet(opportunity.skillTags || []);
  const classMatch = (opportunity.eligibleClasses || []).includes(String(context.student.class).toUpperCase())
    ? 100
    : 0;

  const interestTarget = new Set([category, ...opportunitySkills]);
  const interestMatch = overlapPercent(interestTarget, context.interests);

  const skillReference = opportunitySkills.size
    ? opportunitySkills
    : toNormalizedSet(CATEGORY_SKILL_HINTS[category] || []);

  const skillMatch = overlapPercent(skillReference, context.skills);

  const categoryPerf = context.categoryStats.get(category) || {
    points: 0,
    achievements: 0,
    participation: 0
  };

  const categoryAchievementScore = clamp100((Number(categoryPerf.points || 0) / 150) * 100);
  const categoryParticipationScore = clamp100(Number(categoryPerf.participation || 0) * 20);
  const categoryAcademicScore = computeAcademicCategoryScore(context.academicRecords, category);

  const spiCategoryScore = clamp100(
    0.45 * context.spiBreakdown.spi +
      0.25 * categoryAchievementScore +
      0.15 * categoryParticipationScore +
      0.15 * categoryAcademicScore
  );

  const relevanceScore = clamp100(
    0.4 * interestMatch +
      0.3 * skillMatch +
      0.2 * spiCategoryScore +
      0.1 * classMatch
  );

  const pastParticipationScore = clamp100(Number(categoryPerf.participation || 0) * 25);
  const pastAchievementsScore = clamp100(Number(categoryPerf.achievements || 0) * 35);

  const successProbability = clamp100(
    0.4 * spiCategoryScore +
      0.3 * pastParticipationScore +
      0.2 * pastAchievementsScore +
      0.1 * interestMatch
  );

  return {
    relevanceScore: Number(relevanceScore.toFixed(2)),
    successProbability: Math.round(successProbability),
    metrics: {
      interestMatch: Number(interestMatch.toFixed(2)),
      skillMatch: Number(skillMatch.toFixed(2)),
      spiCategoryScore: Number(spiCategoryScore.toFixed(2)),
      classMatch,
      pastParticipation: Number(pastParticipationScore.toFixed(2)),
      pastAchievements: Number(pastAchievementsScore.toFixed(2))
    }
  };
};
