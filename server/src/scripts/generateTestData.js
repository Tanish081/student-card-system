import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import { ROLES, TEACHER_SUB_ROLES, ACHIEVEMENT_STATUS, PARTICIPATION_STATUS } from '../config/constants.js';
import { ensureClassSection, ensureSubject } from '../services/masterDataService.js';
import { calculateAchievementPoints } from '../services/pointsService.js';
import User from '../models/User.js';
import Teacher from '../models/Teacher.js';
import TeacherRole from '../models/TeacherRole.js';
import Student from '../models/Student.js';
import AcademicRecord from '../models/AcademicRecord.js';
import Achievement from '../models/Achievement.js';
import ParticipationRecord from '../models/ParticipationRecord.js';

dotenv.config();

const schoolId = process.env.DEFAULT_SCHOOL_ID || 'SCH001';
const teacherPassword = 'Teacher@123';
const studentPassword = 'Student@123';

const classLevels = ['6', '7', '8', '9', '10'];
const sections = ['A', 'B'];
const studentsPerSection = 20;
const totalTeachers = 25;
const subjects = ['Mathematics', 'Science', 'English', 'Social Science', 'Computer Science'];
const examTypes = ['UnitTest', 'MidTerm', 'FinalTerm'];
const achievementPositions = ['1st Prize', '2nd Prize', '3rd Prize', 'Participation'];
const achievementLevels = ['School', 'Inter-school', 'District', 'State'];
const achievementCategories = ['sports', 'extracurricular', 'activity'];
const participationCategories = ['sports', 'science', 'cultural'];
const achievementTemplates = {
  sports: ['Football Tournament', 'Athletics Meet', 'Basketball Championship', 'Kabaddi Cup'],
  extracurricular: ['Chess Olympiad', 'Coding Challenge', 'Debate League', 'Quiz Bowl'],
  activity: ['Science Fair', 'Art Showcase', 'Community Drive', 'Innovation Expo']
};
const participationTemplates = {
  sports: ['Inter-house Cricket', 'Athletics Practice Camp', 'Football Skills Workshop'],
  science: ['Robotics Lab Session', 'Science Exhibition Preparation', 'Astronomy Club Activity'],
  cultural: ['Annual Day Dance Practice', 'Drama Club Rehearsal', 'Music Ensemble Performance']
};
const firstNames = [
  'Aarav', 'Vihaan', 'Aditya', 'Ishita', 'Anaya', 'Kiara', 'Riya', 'Rahul', 'Meera', 'Kabir',
  'Aanya', 'Dev', 'Ira', 'Arjun', 'Saanvi', 'Krish', 'Myra', 'Reyansh', 'Nisha', 'Tanvi',
  'Yash', 'Rohan', 'Sneha', 'Aditi', 'Neel', 'Pooja', 'Diya', 'Ishaan', 'Sia', 'Vihaan'
];
const lastNames = [
  'Sharma', 'Verma', 'Gupta', 'Nair', 'Singh', 'Mehta', 'Reddy', 'Kulkarni', 'Patel', 'Joshi',
  'Kumar', 'Desai', 'Kapoor', 'Bose', 'Mishra', 'Iyer', 'Malhotra', 'Saxena', 'Chopra', 'Rao'
];
const teacherFirstNames = [
  'Asha', 'Rohan', 'Meera', 'Kunal', 'Sonal', 'Deepak', 'Neha', 'Ritika', 'Ajay', 'Priya',
  'Nitin', 'Swati', 'Vikas', 'Pallavi', 'Harsh', 'Naveen', 'Anita', 'Suresh', 'Lavanya', 'Ritika',
  'Pankaj', 'Monika', 'Alok', 'Charu', 'Varun', 'Shilpa', 'Gaurav', 'Komal', 'Manish', 'Bhavna'
];
const teacherLastNames = [
  'Verma', 'Singh', 'Sharma', 'Rao', 'Bhatia', 'Kulkarni', 'Mishra', 'Saxena', 'Patil', 'Reddy',
  'Joshi', 'Chawla', 'Malik', 'Trivedi', 'Jain', 'Kaul', 'Agarwal', 'Thomas', 'Pillai', 'Bose'
];
const admissionYearByClass = {
  '6': 2026,
  '7': 2025,
  '8': 2024,
  '9': 2023,
  '10': 2022
};
const birthYearByClass = {
  '6': 2014,
  '7': 2013,
  '8': 2012,
  '9': 2011,
  '10': 2010
};

const pick = (items) => items[Math.floor(Math.random() * items.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomChoiceWeighted = (options) => {
  const totalWeight = options.reduce((sum, option) => sum + option.weight, 0);
  let cursor = Math.random() * totalWeight;

  for (const option of options) {
    cursor -= option.weight;
    if (cursor <= 0) return option.value;
  }

  return options[options.length - 1].value;
};

const buildRunSuffix = () => `${Date.now()}${randomInt(100, 999)}`.slice(-9);
const makeTeacherId = (runSuffix, index) => `TD${runSuffix}${String(index + 1).padStart(2, '0')}`;
const makeTeacherName = (index) => `${teacherFirstNames[index % teacherFirstNames.length]} ${teacherLastNames[index % teacherLastNames.length]}`;
const makeStudentName = (index) => ({
  firstName: firstNames[index % firstNames.length],
  lastName: lastNames[Math.floor(index / firstNames.length) % lastNames.length]
});

const buildDate = (year) => {
  const month = String(randomInt(1, 12)).padStart(2, '0');
  const day = String(randomInt(1, 28)).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildRecentDate = () => {
  const year = pick([2025, 2026]);
  return buildDate(year);
};

const getClassSectionContexts = async () => {
  const contexts = [];

  for (const className of classLevels) {
    for (const sectionName of sections) {
      const { classDoc, sectionDoc } = await ensureClassSection({ schoolId, className, sectionName });
      contexts.push({
        label: `${className}${sectionName}`,
        className,
        sectionName,
        classDoc,
        sectionDoc
      });
    }
  }

  return contexts;
};

const createTeachers = async (runSuffix) => {
  const teachers = [];

  for (let index = 0; index < totalTeachers; index += 1) {
    const teacherID = makeTeacherId(runSuffix, index);
    const name = makeTeacherName(index);
    const email = `synthetic.teacher.${runSuffix}.${String(index + 1).padStart(2, '0')}@school.edu`;

    const user = await User.create({
      schoolId,
      name,
      email,
      password: teacherPassword,
      role: ROLES.TEACHER,
      linkedTeacherID: teacherID
    });

    const teacher = await Teacher.create({
      schoolId,
      teacherID,
      name,
      email,
      userId: user._id
    });

    teachers.push({
      teacherID,
      name,
      email,
      userId: user._id,
      teacherId: teacher._id
    });
  }

  return teachers;
};

const createTeacherRoleAssignments = async (teachers, classSectionContexts) => {
  const mathSubject = await ensureSubject({ schoolId, subjectName: 'Mathematics' });
  const assignments = {};
  const roleDocs = [];

  classSectionContexts.forEach((context, index) => {
    const classTeacher = teachers[index];
    const subjectTeacher = teachers[10 + index];
    const sportsTeacher = teachers[20 + (index % 5)];

    assignments[context.label] = {
      classTeacherID: classTeacher.teacherID,
      subjectTeacherID: subjectTeacher.teacherID,
      sportsTeacherID: sportsTeacher.teacherID
    };

    roleDocs.push({
      schoolId,
      teacherID: classTeacher.teacherID,
      role: TEACHER_SUB_ROLES.CLASS_TEACHER,
      class: context.label,
      classRef: context.classDoc._id,
      sectionRef: context.sectionDoc._id,
      subject: null,
      subjectRef: null
    });

    roleDocs.push({
      schoolId,
      teacherID: subjectTeacher.teacherID,
      role: TEACHER_SUB_ROLES.SUBJECT_TEACHER,
      class: context.label,
      classRef: context.classDoc._id,
      sectionRef: context.sectionDoc._id,
      subject: 'Mathematics',
      subjectRef: mathSubject?._id || null
    });

    roleDocs.push({
      schoolId,
      teacherID: sportsTeacher.teacherID,
      role: TEACHER_SUB_ROLES.SPORTS_TEACHER,
      class: context.label,
      classRef: context.classDoc._id,
      sectionRef: context.sectionDoc._id,
      subject: null,
      subjectRef: null
    });
  });

  await TeacherRole.insertMany(roleDocs, { ordered: true });

  return assignments;
};

const createStudents = async (classSectionContexts, teacherAssignments) => {
  const students = [];
  let studentIndex = 0;

  for (const context of classSectionContexts) {
    for (let count = 0; count < studentsPerSection; count += 1) {
      const nameParts = makeStudentName(studentIndex);
      const student = await Student.create({
        schoolId,
        firstName: nameParts.firstName,
        lastName: nameParts.lastName,
        dob: buildDate(birthYearByClass[context.className]),
        class: context.className,
        section: context.sectionName,
        admissionYear: admissionYearByClass[context.className],
        classRef: context.classDoc._id,
        sectionRef: context.sectionDoc._id,
        profileCompleted: false
      });

      const email = `${student.firstName.toLowerCase()}.${student.uid.toLowerCase()}@student.school.edu`;
      const user = await User.create({
        schoolId,
        name: student.name,
        email,
        password: studentPassword,
        role: ROLES.STUDENT,
        linkedStudentUID: student.uid
      });

      student.userId = user._id;
      await student.save();

      students.push({
        uid: student.uid,
        name: student.name,
        firstName: student.firstName,
        className: context.className,
        sectionName: context.sectionName,
        label: context.label,
        email,
        classTeacherID: teacherAssignments[context.label].classTeacherID,
        subjectTeacherID: teacherAssignments[context.label].subjectTeacherID,
        sportsTeacherID: teacherAssignments[context.label].sportsTeacherID
      });

      studentIndex += 1;
    }
  }

  return students;
};

const createAcademicRecords = async (students) => {
  const subjectRefs = {};

  for (const subject of subjects) {
    subjectRefs[subject] = await ensureSubject({ schoolId, subjectName: subject });
  }

  const academicRecords = [];
  for (const student of students) {
    for (const subject of subjects) {
      academicRecords.push({
        schoolId,
        studentUID: student.uid,
        subject,
        subjectRef: subjectRefs[subject]?._id || null,
        marks: randomInt(60, 95),
        examType: pick(examTypes),
        teacherID: subject === 'Mathematics' ? student.subjectTeacherID : student.classTeacherID
      });
    }
  }

  await AcademicRecord.insertMany(academicRecords, { ordered: false });
  return academicRecords.length;
};

const createAchievements = async (students) => {
  const achievementDocs = [];

  for (const student of students) {
    for (let index = 0; index < 2; index += 1) {
      const category = pick(achievementCategories);
      const level = pick(achievementLevels);
      const position = pick(achievementPositions);
      const status = randomChoiceWeighted([
        { value: ACHIEVEMENT_STATUS.APPROVED, weight: 55 },
        { value: ACHIEVEMENT_STATUS.PENDING, weight: 30 },
        { value: ACHIEVEMENT_STATUS.REJECTED, weight: 15 }
      ]);
      const enteredBy = category === 'sports'
        ? student.sportsTeacherID
        : randomChoiceWeighted([
            { value: student.classTeacherID, weight: 60 },
            { value: student.subjectTeacherID, weight: 40 }
          ]);

      achievementDocs.push({
        schoolId,
        studentUID: student.uid,
        eventName: `${pick(achievementTemplates[category])} ${randomInt(1, 4)}`,
        category,
        level,
        position,
        points: calculateAchievementPoints({ position, level }),
        certificateURL: null,
        status,
        enteredBy,
        verifiedBy: status === ACHIEVEMENT_STATUS.PENDING ? null : student.classTeacherID
      });
    }
  }

  await Achievement.insertMany(achievementDocs, { ordered: false });
  return achievementDocs.length;
};

const createParticipationRecords = async (students) => {
  const participationDocs = [];

  for (const student of students) {
    for (let index = 0; index < 2; index += 1) {
      const category = pick(participationCategories);
      const teacherID = category === 'sports'
        ? student.sportsTeacherID
        : category === 'science'
          ? student.subjectTeacherID
          : student.classTeacherID;

      participationDocs.push({
        schoolId,
        studentUID: student.uid,
        activityName: pick(participationTemplates[category]),
        category,
        date: buildRecentDate(),
        teacherID,
        status: randomChoiceWeighted([
          { value: PARTICIPATION_STATUS.PENDING, weight: 40 },
          { value: PARTICIPATION_STATUS.APPROVED, weight: 45 },
          { value: PARTICIPATION_STATUS.REJECTED, weight: 15 }
        ])
      });
    }
  }

  await ParticipationRecord.insertMany(participationDocs, { ordered: false });
  return participationDocs.length;
};

const run = async () => {
  try {
    await connectDB(process.env.MONGO_URI);

    const runSuffix = buildRunSuffix();
    const classSectionContexts = await getClassSectionContexts();
    const teachers = await createTeachers(runSuffix);
    const teacherAssignments = await createTeacherRoleAssignments(teachers, classSectionContexts);
    const students = await createStudents(classSectionContexts, teacherAssignments);
    const academicRecordCount = await createAcademicRecords(students);
    const achievementCount = await createAchievements(students);
    const participationCount = await createParticipationRecords(students);

    console.log('Synthetic test data generated successfully');
    console.log(`Teachers created: ${teachers.length}`);
    console.log(`Students created: ${students.length}`);
    console.log(`Teacher role assignments created: ${classSectionContexts.length * 3}`);
    console.log(`Academic records created: ${academicRecordCount}`);
    console.log(`Achievements created: ${achievementCount}`);
    console.log(`Participation records created: ${participationCount}`);
    console.log(`Teacher password for generated users: ${teacherPassword}`);
    console.log(`Student password for generated users: ${studentPassword}`);
    console.log(`Sample teacher login: ${teachers[0].email}`);
    console.log(`Sample student login: ${students[0].email}`);
    process.exit(0);
  } catch (error) {
    console.error('Synthetic test data generation failed:', error);
    process.exit(1);
  }
};

run();
