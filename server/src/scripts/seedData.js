export const adminSeed = {
  name: 'System Admin',
  email: 'admin@school.edu',
  password: 'Admin@123',
  role: 'admin'
};

export const principalSeed = {
  name: 'Dr. Meera Sharma',
  email: 'principal@school.edu',
  password: 'Principal@123',
  role: 'principal'
};

export const teachersSeed = [
  {
    teacherID: 'T101',
    name: 'Asha Verma',
    email: 'asha.verma@school.edu',
    password: 'Teacher@123'
  },
  {
    teacherID: 'T102',
    name: 'Rohan Singh',
    email: 'rohan.singh@school.edu',
    password: 'Teacher@123'
  }
];

export const teacherRolesSeed = [
  { teacherID: 'T101', role: 'ClassTeacher', class: '8A', subject: null },
  { teacherID: 'T101', role: 'SubjectTeacher', class: '8A', subject: 'Mathematics' },
  { teacherID: 'T101', role: 'SubjectTeacher', class: '9B', subject: 'Mathematics' },
  { teacherID: 'T101', role: 'SubjectTeacher', class: '10A', subject: 'Mathematics' },
  { teacherID: 'T102', role: 'SportsTeacher', class: '8A', subject: null }
];

export const studentsSeed = [
  {
    firstName: 'Rahul',
    lastName: 'Kumar',
    dob: '2012-08-15',
    class: '8',
    section: 'A',
    admissionYear: 2024
  },
  {
    firstName: 'Anaya',
    lastName: 'Gupta',
    dob: '2011-11-03',
    class: '9',
    section: 'B',
    admissionYear: 2023
  },
  {
    firstName: 'Ishaan',
    lastName: 'Mehta',
    dob: '2010-01-21',
    class: '10',
    section: 'A',
    admissionYear: 2022
  },
  {
    firstName: 'Sia',
    lastName: 'Nair',
    dob: '2013-06-10',
    class: '7',
    section: 'C',
    admissionYear: 2025
  },
  {
    firstName: 'Vihaan',
    lastName: 'Reddy',
    dob: '2014-02-05',
    class: '6',
    section: 'B',
    admissionYear: 2026
  }
];

export const participationSeed = [
  {
    activityName: 'Morning Assembly Leadership',
    category: 'leadership',
    date: '2026-01-20',
    teacherID: 'T101',
    status: 'Approved'
  },
  {
    activityName: 'Community Cleanliness Drive',
    category: 'service',
    date: '2026-02-11',
    teacherID: 'T101',
    status: 'Pending'
  }
];
