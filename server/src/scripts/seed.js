import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Teacher from '../models/Teacher.js';
import TeacherRole from '../models/TeacherRole.js';
import Student from '../models/Student.js';
import Achievement from '../models/Achievement.js';
import AcademicRecord from '../models/AcademicRecord.js';
import Guidance from '../models/Guidance.js';
import SchoolClass from '../models/Class.js';
import Section from '../models/Section.js';
import Subject from '../models/Subject.js';
import ParticipationRecord from '../models/ParticipationRecord.js';
import AuditLog from '../models/AuditLog.js';
import Counter from '../models/Counter.js';
import { calculateAchievementPoints } from '../services/pointsService.js';
import { ensureClassSection, ensureSubject, parseClassAssignment } from '../services/masterDataService.js';
import {
  adminSeed,
  participationSeed,
  principalSeed,
  studentsSeed,
  teacherRolesSeed,
  teachersSeed
} from './seedData.js';

dotenv.config();

const schoolId = process.env.DEFAULT_SCHOOL_ID || 'SCH001';

const resetCollections = async () => {
  await Promise.all([
    User.deleteMany({ schoolId }),
    Teacher.deleteMany({ schoolId }),
    TeacherRole.deleteMany({ schoolId }),
    Student.deleteMany({ schoolId }),
    Achievement.deleteMany({ schoolId }),
    AcademicRecord.deleteMany({ schoolId }),
    Guidance.deleteMany({ schoolId }),
    SchoolClass.deleteMany({ schoolId }),
    Section.deleteMany({ schoolId }),
    Subject.deleteMany({ schoolId }),
    ParticipationRecord.deleteMany({ schoolId }),
    AuditLog.deleteMany({ schoolId }),
    Counter.deleteMany({})
  ]);
};

const seedUsersAndPeople = async () => {
  const admin = await User.create({ ...adminSeed, schoolId });
  const principal = await User.create({ ...principalSeed, schoolId });

  const teacherUserDocs = await Promise.all(
    teachersSeed.map((teacher) =>
      User.create({
        schoolId,
        name: teacher.name,
        email: teacher.email,
        password: teacher.password,
        role: 'teacher',
        linkedTeacherID: teacher.teacherID
      })
    )
  );

  await Promise.all(
    teachersSeed.map((teacher, index) =>
      Teacher.create({
        schoolId,
        teacherID: teacher.teacherID,
        name: teacher.name,
        email: teacher.email,
        userId: teacherUserDocs[index]._id
      })
    )
  );

  for (const item of teacherRolesSeed) {
    const parsed = parseClassAssignment(item.class || '');
    const { classDoc, sectionDoc } = parsed.className
      ? await ensureClassSection({ schoolId, className: parsed.className, sectionName: parsed.sectionName })
      : { classDoc: null, sectionDoc: null };
    const subjectDoc = await ensureSubject({ schoolId, subjectName: item.subject });

    await TeacherRole.create({
      ...item,
      schoolId,
      classRef: classDoc?._id || null,
      sectionRef: sectionDoc?._id || null,
      subjectRef: subjectDoc?._id || null
    });
  }

  const studentDocs = [];
  for (const student of studentsSeed) {
    const { classDoc, sectionDoc } = await ensureClassSection({
      schoolId,
      className: student.class,
      sectionName: student.section
    });

    const doc = await Student.create({
      schoolId,
      ...student,
      classRef: classDoc?._id || null,
      sectionRef: sectionDoc?._id || null
    });
    studentDocs.push(doc);
  }

  await Promise.all(
    studentDocs.map(async (studentDoc) => {
      const email = `${studentDoc.firstName.toLowerCase()}.${studentDoc.uid.toLowerCase()}@student.school.edu`;
      const studentUser = await User.create({
        schoolId,
        name: studentDoc.name,
        email,
        password: 'Student@123',
        role: 'student',
        linkedStudentUID: studentDoc.uid
      });

      studentDoc.userId = studentUser._id;
      await studentDoc.save();
    })
  );

  return { admin, principal, studentDocs };
};

const seedAcademicRecords = async (students) => {
  const subjectPack = [
    { subject: 'Mathematics', marks: 88, examType: 'MidTerm', teacherID: 'T101' },
    { subject: 'Science', marks: 81, examType: 'MidTerm', teacherID: 'T101' },
    { subject: 'English', marks: 76, examType: 'UnitTest', teacherID: 'T101' }
  ];

  for (const student of students) {
    for (const item of subjectPack) {
      const subjectDoc = await ensureSubject({ schoolId, subjectName: item.subject });
      await AcademicRecord.create({
        schoolId,
        studentUID: student.uid,
        ...item,
        subjectRef: subjectDoc?._id || null,
        marks: Math.max(50, Math.min(98, item.marks + Math.floor(Math.random() * 10) - 5))
      });
    }
  }
};

const seedAchievements = async (students) => {
  const templates = [
    {
      eventName: 'Inter-School Football Tournament',
      category: 'sports',
      level: 'Inter-school',
      position: '2nd Prize',
      status: 'Approved',
      enteredBy: 'T102',
      verifiedBy: 'T101'
    },
    {
      eventName: 'Science Exhibition',
      category: 'activity',
      level: 'School',
      position: 'Participation',
      status: 'Approved',
      enteredBy: 'T101',
      verifiedBy: 'T101'
    },
    {
      eventName: 'Math Olympiad',
      category: 'extracurricular',
      level: 'District',
      position: '1st Prize',
      status: 'Pending',
      enteredBy: 'T101',
      verifiedBy: null
    }
  ];

  for (const student of students) {
    for (const template of templates) {
      await Achievement.create({
        schoolId,
        studentUID: student.uid,
        eventName: template.eventName,
        category: template.category,
        level: template.level,
        position: template.position,
        points: calculateAchievementPoints({
          position: template.position,
          level: template.level
        }),
        certificateURL: null,
        status: template.status,
        enteredBy: template.enteredBy,
        verifiedBy: template.verifiedBy
      });
    }

    await Guidance.create({
      schoolId,
      studentUID: student.uid,
      message: 'Maintain consistency in weekly revision and physical activity.',
      addedByTeacherID: 'T101'
    });

    for (const template of participationSeed) {
      await ParticipationRecord.create({
        schoolId,
        studentUID: student.uid,
        activityName: template.activityName,
        category: template.category,
        date: template.date,
        teacherID: template.teacherID,
        status: template.status
      });
    }
  }
};

const runSeed = async () => {
  try {
    await connectDB(process.env.MONGO_URI);

    await resetCollections();
    const { studentDocs } = await seedUsersAndPeople();
    await seedAcademicRecords(studentDocs);
    await seedAchievements(studentDocs);

    console.log('Seed completed successfully');
    console.log('Admin Login: admin@school.edu / Admin@123');
    console.log('Principal Login: principal@school.edu / Principal@123');
    console.log('Teacher Login: asha.verma@school.edu / Teacher@123');
    const firstStudent = studentDocs[0];
    console.log(
      `Student Login: ${firstStudent.firstName.toLowerCase()}.${firstStudent.uid.toLowerCase()}@student.school.edu / Student@123`
    );
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

runSeed();
