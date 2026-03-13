export const ROLES = {
  ADMIN: 'admin',
  PRINCIPAL: 'principal',
  TEACHER: 'teacher',
  STUDENT: 'student'
};

export const TEACHER_SUB_ROLES = {
  CLASS_TEACHER: 'ClassTeacher',
  SUBJECT_TEACHER: 'SubjectTeacher',
  SPORTS_TEACHER: 'SportsTeacher'
};

export const ACHIEVEMENT_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected'
};

export const PARTICIPATION_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected'
};

export const ACHIEVEMENT_BASE_POINTS = {
  Participation: 5,
  '3rd Prize': 30,
  '2nd Prize': 40,
  '1st Prize': 50
};

export const ACHIEVEMENT_LEVEL_MULTIPLIERS = {
  School: 1,
  'Inter-school': 1.5,
  District: 2,
  State: 3,
  National: 5
};

export const SPI_CATEGORIES = [
  { min: 90, max: 100, label: 'Exceptional' },
  { min: 75, max: 89.99, label: 'High Potential' },
  { min: 60, max: 74.99, label: 'Developing' },
  { min: 40, max: 59.99, label: 'Needs Support' },
  { min: 0, max: 39.99, label: 'At Risk' }
];
