import {
  ACHIEVEMENT_BASE_POINTS,
  ACHIEVEMENT_LEVEL_MULTIPLIERS
} from '../config/constants.js';

export const calculateAchievementPoints = ({ position, level }) => {
  const base = ACHIEVEMENT_BASE_POINTS[position] ?? 0;
  const multiplier = ACHIEVEMENT_LEVEL_MULTIPLIERS[level] ?? 1;
  return Number((base * multiplier).toFixed(2));
};
