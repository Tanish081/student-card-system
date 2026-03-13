import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

dotenv.config();

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000/api';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/school_performance';
const JWT_SECRET = process.env.JWT_SECRET;

const results = [];

const state = {
  adminToken: null,
  adminUserId: null,
  teacherAToken: null,
  teacherBToken: null,
  principalToken: null,
  studentAToken: null,
  studentAUID: null,
  studentBUID: null,
  studentAEmail: null,
  studentBEmail: null,
  student8AUID: null,
  student9BUID: null,
  createdTeacherId: null,
  createdTeacherEmail: null,
  createdTeacherPassword: 'Teacher@123',
  pendingAchievementId: null,
  pendingParticipationId: null,
  academicRecordId: null,
  classTeacher8AMappingId: null,
  studentAProfileCompleted: false,
  createdSchemeId: null,
  baselineAudit: null,
  finalAudit: null
};

const nowStamp = () => new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);

const requestApi = async ({ method = 'GET', path, token, body }) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    const buffer = Buffer.from(await response.arrayBuffer());
    return {
      status: response.status,
      data: null,
      text: '',
      contentType,
      buffer
    };
  }

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  return {
    status: response.status,
    data,
    text,
    contentType,
    buffer: null
  };
};

const assertStatus = (response, expected, context) => {
  if (response.status !== expected) {
    throw new Error(`${context}: expected ${expected}, got ${response.status}. body=${response.text}`);
  }
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const runTest = async (name, fn) => {
  try {
    const message = (await fn()) || 'OK';
    results.push({ name, status: 'PASS', message });
    console.log(`PASS | ${name} | ${message}`);
    return true;
  } catch (error) {
    const message = error?.message || 'Unknown error';
    results.push({ name, status: 'FAIL', message });
    console.log(`FAIL | ${name} | ${message}`);
    return false;
  }
};

const getAuditCounts = async () => {
  const collection = mongoose.connection.collection('auditlogs');
  const actions = [
    'teacher-role-assigned',
    'achievement-verified',
    'academic-record-added',
    'participation-approved',
    'profile-completed',
    'scheme-created',
    'student-card-generated',
    'public-verification-requested'
  ];

  const counts = {};
  for (const action of actions) {
    counts[action] = await collection.countDocuments({ action });
  }

  return counts;
};

const login = async (email, password) => {
  const response = await requestApi({
    method: 'POST',
    path: '/auth/login',
    body: { email, password }
  });

  assertStatus(response, 200, `Login failed for ${email}`);
  return response.data.data;
};

const critical = async (name, fn) => {
  const passed = await runTest(name, fn);
  if (!passed) throw new Error(`Critical test failed: ${name}`);
};

const main = async () => {
  let connected = false;
  try {
    await mongoose.connect(MONGO_URI);
    connected = true;

    await critical('API health check', async () => {
      const response = await requestApi({ method: 'GET', path: '/health' });
      assertStatus(response, 200, 'Health check failed');
      return response.data?.message || 'API healthy';
    });

    await critical('Admin login', async () => {
      const payload = await login('admin@school.edu', 'Admin@123');
      state.adminToken = payload.token;
      state.adminUserId = payload.user.id;
      return `adminUserId=${state.adminUserId}`;
    });

    await critical('Teacher A login', async () => {
      const payload = await login('asha.verma@school.edu', 'Teacher@123');
      state.teacherAToken = payload.token;
      return `teacherId=${payload.user.linkedTeacherID}`;
    });

    await critical('Teacher B login', async () => {
      const payload = await login('rohan.singh@school.edu', 'Teacher@123');
      state.teacherBToken = payload.token;
      return `teacherId=${payload.user.linkedTeacherID}`;
    });

    await critical('Principal login', async () => {
      const payload = await login('principal@school.edu', 'Principal@123');
      state.principalToken = payload.token;
      return `principalId=${payload.user.id}`;
    });

    await critical('Read baseline audit counters', async () => {
      state.baselineAudit = await getAuditCounts();
      return JSON.stringify(state.baselineAudit);
    });

    await critical('Load seeded students for class workflows', async () => {
      const response = await requestApi({
        method: 'GET',
        path: '/admin/students',
        token: state.adminToken
      });
      assertStatus(response, 200, 'Admin student list fetch failed');

      const students = response.data.data.students || [];
      const in8A = students.find((s) => s.class === '8' && s.section === 'A');
      const in9B = students.find((s) => s.class === '9' && s.section === 'B');
      assert(in8A?.uid, 'No student found in class 8A');
      assert(in9B?.uid, 'No student found in class 9B');

      state.student8AUID = in8A.uid;
      state.student9BUID = in9B.uid;
      return `8A=${state.student8AUID}, 9B=${state.student9BUID}`;
    });

    await runTest('Admin creates teacher', async () => {
      const stamp = nowStamp();
      state.createdTeacherId = `T${stamp.slice(-5)}`;
      state.createdTeacherEmail = `edge.teacher.${stamp}@school.edu`;

      const response = await requestApi({
        method: 'POST',
        path: '/admin/create-teacher',
        token: state.adminToken,
        body: {
          teacherID: state.createdTeacherId,
          name: 'Edge Case Teacher',
          email: state.createdTeacherEmail,
          password: state.createdTeacherPassword
        }
      });

      assertStatus(response, 201, 'Admin create teacher failed');
      return `teacherID=${state.createdTeacherId}`;
    });

    await runTest('Admin creates student (UID collision setup A)', async () => {
      const stamp = nowStamp();
      state.studentAEmail = `edge.studentA.${stamp}@student.school.edu`;
      const response = await requestApi({
        method: 'POST',
        path: '/admin/create-student',
        token: state.adminToken,
        body: {
          firstName: 'Rahul',
          lastName: 'EdgeOne',
          dob: '2012-08-15',
          class: '8',
          section: 'E',
          admissionYear: 2024,
          email: state.studentAEmail,
          password: 'Student@123'
        }
      });

      assertStatus(response, 201, 'Admin create student A failed');
      state.studentAUID = response.data.data.student.uid;
      return `uid=${state.studentAUID}`;
    });

    await runTest('Admin creates student (UID collision setup B)', async () => {
      const stamp = nowStamp();
      state.studentBEmail = `edge.studentB.${stamp}@student.school.edu`;
      const response = await requestApi({
        method: 'POST',
        path: '/admin/create-student',
        token: state.adminToken,
        body: {
          firstName: 'Rahul',
          lastName: 'EdgeTwo',
          dob: '2012-08-15',
          class: '8',
          section: 'E',
          admissionYear: 2024,
          email: state.studentBEmail,
          password: 'Student@123'
        }
      });

      assertStatus(response, 201, 'Admin create student B failed');
      state.studentBUID = response.data.data.student.uid;
      return `uid=${state.studentBUID}`;
    });

    await runTest('UID collision test (serial prefixes prevent duplicates)', async () => {
      assert(state.studentAUID && state.studentBUID, 'Missing collision test student UIDs');
      assert(state.studentAUID !== state.studentBUID, 'UIDs are identical but should be unique');

      const uidPattern = /^\d{4}-[A-Z]{3}-\d{8}-\d{4}$/;
      assert(uidPattern.test(state.studentAUID), `UID A format invalid: ${state.studentAUID}`);
      assert(uidPattern.test(state.studentBUID), `UID B format invalid: ${state.studentBUID}`);

      const suffixA = state.studentAUID.split('-').slice(1).join('-');
      const suffixB = state.studentBUID.split('-').slice(1).join('-');
      assert(suffixA === suffixB, 'UID suffixes should match identical identity data');

      return `${state.studentAUID} vs ${state.studentBUID}`;
    });

    await runTest('Student A login', async () => {
      assert(state.studentAEmail, 'Student A email not captured during creation');
      const payload = await login(state.studentAEmail, 'Student@123');
      state.studentAToken = payload.token;
      assert(
        payload.profileCompletionRequired === true,
        'Expected profileCompletionRequired=true for first student login'
      );
      return `studentUID=${state.studentAUID}`;
    });

    await runTest('Student completes profile successfully', async () => {
      const response = await requestApi({
        method: 'POST',
        path: '/students/complete-profile',
        token: state.studentAToken,
        body: {
          gender: 'Male',
          address: '123 Edge Street',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411001',
          parentName: 'Rakesh Edge',
          parentContact: '9999988888',
          familyIncome: 220000,
          category: 'OBC',
          aadhaar: '123412341234'
        }
      });

      assertStatus(response, 200, 'Student profile completion failed');
      assert(
        response.data.data.profileCompleted === true,
        'Expected profileCompleted=true after completion'
      );
      state.studentAProfileCompleted = true;
    });

    await runTest('Student login after profile completion no longer requires completion', async () => {
      const payload = await login(state.studentAEmail, 'Student@123');
      state.studentAToken = payload.token;
      assert(
        payload.profileCompletionRequired === false,
        'Expected profileCompletionRequired=false after profile completion'
      );
    });

    await runTest('Admin creates scheme', async () => {
      const stamp = nowStamp();
      const response = await requestApi({
        method: 'POST',
        path: '/schemes',
        token: state.adminToken,
        body: {
          schemeName: `Edge Scholarship ${stamp}`,
          description: 'Edge case integration scholarship',
          minAcademicScore: 0,
          minSPI: 0,
          maxFamilyIncome: 350000,
          eligibleClasses: ['8'],
          sportsRequired: false,
          activityRequired: false,
          active: true
        }
      });
      assertStatus(response, 201, 'Admin scheme creation failed');
      state.createdSchemeId = response.data.data._id;
      return `schemeId=${state.createdSchemeId}`;
    });

    await runTest('Teacher cannot create scheme (admin only)', async () => {
      const response = await requestApi({
        method: 'POST',
        path: '/schemes',
        token: state.teacherAToken,
        body: {
          schemeName: `Forbidden Scheme ${nowStamp()}`,
          description: 'Forbidden',
          minAcademicScore: 0,
          minSPI: 0,
          maxFamilyIncome: 999999,
          eligibleClasses: ['8'],
          sportsRequired: false,
          activityRequired: false,
          active: true
        }
      });
      assertStatus(response, 403, 'Teacher should not create scheme');
    });

    await runTest('Scheme eligibility detection returns created scheme', async () => {
      const response = await requestApi({
        method: 'GET',
        path: `/schemes/eligible/${state.studentAUID}`,
        token: state.adminToken
      });
      assertStatus(response, 200, 'Eligibility endpoint failed');

      const ids = (response.data.data.eligibleSchemes || []).map((item) => item._id);
      assert(ids.includes(state.createdSchemeId), 'Expected created scheme in eligible list');
      return `eligibleCount=${ids.length}`;
    });

    await runTest('Admin assigns class teacher role', async () => {
      const response = await requestApi({
        method: 'PUT',
        path: '/admin/assign-teacher-role',
        token: state.adminToken,
        body: {
          teacherID: state.createdTeacherId,
          role: 'ClassTeacher',
          class: '8E'
        }
      });
      assertStatus(response, 200, 'Assign class teacher failed');
      return `mapping=${response.data.data._id}`;
    });

    await runTest('Admin assigns subject teacher role', async () => {
      const response = await requestApi({
        method: 'PUT',
        path: '/admin/assign-teacher-role',
        token: state.adminToken,
        body: {
          teacherID: state.createdTeacherId,
          role: 'SubjectTeacher',
          class: '8E',
          subject: 'Mathematics'
        }
      });
      assertStatus(response, 200, 'Assign subject teacher failed');
      return `mapping=${response.data.data._id}`;
    });

    await runTest('Teacher adds achievement', async () => {
      const response = await requestApi({
        method: 'POST',
        path: '/achievements',
        token: state.teacherAToken,
        body: {
          studentUID: state.student8AUID,
          eventName: 'Edge Case Math Contest',
          category: 'extracurricular',
          level: 'District',
          position: '2nd Prize'
        }
      });
      assertStatus(response, 201, 'Teacher add achievement failed');
      state.pendingAchievementId = response.data.data._id;
      return `achievementId=${state.pendingAchievementId}`;
    });

    await runTest('Teacher adds participation', async () => {
      const response = await requestApi({
        method: 'POST',
        path: '/participation',
        token: state.teacherAToken,
        body: {
          studentUID: state.student8AUID,
          activityName: 'Edge Case Debate Participation',
          category: 'communication',
          date: '2026-03-14'
        }
      });
      assertStatus(response, 201, 'Teacher add participation failed');
      state.pendingParticipationId = response.data.data._id;
      return `participationId=${state.pendingParticipationId}`;
    });

    await runTest('Student cannot create achievements', async () => {
      const response = await requestApi({
        method: 'POST',
        path: '/achievements',
        token: state.studentAToken,
        body: {
          studentUID: state.studentAUID,
          eventName: 'Forbidden Student Post',
          category: 'activity',
          level: 'School',
          position: 'Participation'
        }
      });
      assertStatus(response, 403, 'Student should be forbidden from creating achievements');
    });

    await runTest('Student cannot approve participation', async () => {
      const response = await requestApi({
        method: 'PUT',
        path: `/participation/approve/${state.pendingParticipationId}`,
        token: state.studentAToken,
        body: { status: 'Approved' }
      });
      assertStatus(response, 403, 'Student should be forbidden from approving participation');
    });

    await runTest('Student cannot approve achievements', async () => {
      const response = await requestApi({
        method: 'PATCH',
        path: `/achievements/${state.pendingAchievementId}/verify`,
        token: state.studentAToken,
        body: { status: 'Approved' }
      });
      assertStatus(response, 403, 'Student should be forbidden from approving achievements');
    });

    await runTest('Student cannot view another student profile', async () => {
      const response = await requestApi({
        method: 'GET',
        path: `/students/${state.studentBUID}`,
        token: state.studentAToken
      });
      assertStatus(response, 403, 'Student should be forbidden from viewing another student profile');
    });

    await runTest('Student cannot access teacher APIs', async () => {
      const response = await requestApi({
        method: 'GET',
        path: '/teachers/me/assignments',
        token: state.studentAToken
      });
      assertStatus(response, 403, 'Student should be forbidden from teacher APIs');
    });

    await runTest('Student cannot access admin APIs', async () => {
      const response = await requestApi({
        method: 'GET',
        path: '/admin/teachers',
        token: state.studentAToken
      });
      assertStatus(response, 403, 'Student should be forbidden from admin APIs');
    });

    await runTest('Teacher cannot assign teacher roles', async () => {
      const response = await requestApi({
        method: 'PUT',
        path: '/admin/assign-teacher-role',
        token: state.teacherAToken,
        body: {
          teacherID: state.createdTeacherId,
          role: 'SportsTeacher',
          class: '8E'
        }
      });
      assertStatus(response, 403, 'Teacher should be forbidden from assigning teacher roles');
    });

    await runTest('Teacher cannot create teachers', async () => {
      const response = await requestApi({
        method: 'POST',
        path: '/admin/create-teacher',
        token: state.teacherAToken,
        body: {
          teacherID: `TX${nowStamp().slice(-4)}`,
          name: 'Forbidden Teacher Create',
          email: `forbidden.teacher.${nowStamp()}@school.edu`,
          password: 'Teacher@123'
        }
      });
      assertStatus(response, 403, 'Teacher should be forbidden from creating teachers');
    });

    await runTest('Teacher cannot create students', async () => {
      const response = await requestApi({
        method: 'POST',
        path: '/admin/create-student',
        token: state.teacherAToken,
        body: {
          firstName: 'Forbidden',
          lastName: 'Student',
          dob: '2012-09-10',
          class: '8',
          section: 'E',
          admissionYear: 2024,
          email: `forbidden.student.${nowStamp()}@student.school.edu`,
          password: 'Student@123'
        }
      });
      assertStatus(response, 403, 'Teacher should be forbidden from creating students');
    });

    await runTest('Teacher cannot approve participation for unassigned class', async () => {
      const response = await requestApi({
        method: 'PUT',
        path: `/participation/approve/${state.pendingParticipationId}`,
        token: state.teacherBToken,
        body: { status: 'Approved' }
      });
      assertStatus(response, 403, 'Wrong teacher should be forbidden from approving participation');
    });

    await runTest('Class teacher can approve participation for assigned class', async () => {
      const response = await requestApi({
        method: 'PUT',
        path: `/participation/approve/${state.pendingParticipationId}`,
        token: state.teacherAToken,
        body: { status: 'Approved' }
      });
      assertStatus(response, 200, 'Class teacher should be allowed to approve participation');
    });

    await runTest('Class teacher can verify achievement for assigned class', async () => {
      const response = await requestApi({
        method: 'PATCH',
        path: `/achievements/${state.pendingAchievementId}/verify`,
        token: state.teacherAToken,
        body: { status: 'Approved' }
      });
      assertStatus(response, 200, 'Class teacher should be allowed to verify achievement');
    });

    await runTest('Teacher adds academic record', async () => {
      const response = await requestApi({
        method: 'POST',
        path: '/teachers/academic-records',
        token: state.teacherAToken,
        body: {
          studentUID: state.student8AUID,
          subject: 'Mathematics',
          marks: 87,
          examType: 'EdgeCaseTest'
        }
      });
      assertStatus(response, 201, 'Teacher add academic record failed');
      state.academicRecordId = response.data.data._id;
      return `recordId=${state.academicRecordId}`;
    });

    await runTest('Teacher cannot modify another teacher academic records', async () => {
      const response = await requestApi({
        method: 'PATCH',
        path: `/teachers/academic-records/${state.academicRecordId}`,
        token: state.teacherBToken,
        body: {
          marks: 91
        }
      });
      assertStatus(response, 403, 'Teacher should be forbidden from modifying another teacher record');
    });

    await runTest('JWT missing token returns 401', async () => {
      const response = await requestApi({ method: 'GET', path: '/admin/students' });
      assertStatus(response, 401, 'Missing token should return 401');
    });

    await runTest('JWT invalid token returns 401', async () => {
      const response = await requestApi({
        method: 'GET',
        path: '/admin/students',
        token: 'this-is-not-a-valid-token'
      });
      assertStatus(response, 401, 'Invalid token should return 401');
    });

    await runTest('JWT expired token returns 401', async () => {
      assert(JWT_SECRET, 'JWT_SECRET is required for expired token test');

      const expiredToken = jwt.sign(
        {
          id: state.adminUserId,
          role: 'admin',
          schoolId: 'SCH001'
        },
        JWT_SECRET,
        { expiresIn: -1 }
      );

      const response = await requestApi({
        method: 'GET',
        path: '/admin/students',
        token: expiredToken
      });
      assertStatus(response, 401, 'Expired token should return 401');
    });

    await runTest('SPI recalculates after approved participation', async () => {
      const before = await requestApi({
        method: 'GET',
        path: `/students/${state.student8AUID}/dashboard`,
        token: state.adminToken
      });
      assertStatus(before, 200, 'Failed to fetch dashboard before participation approval');
      const beforeParticipationScore = Number(before.data.data.spi.participationScore);

      const create = await requestApi({
        method: 'POST',
        path: '/participation',
        token: state.teacherAToken,
        body: {
          studentUID: state.student8AUID,
          activityName: 'SPI Recalculation Event',
          category: 'leadership',
          date: '2026-03-17'
        }
      });
      assertStatus(create, 201, 'Failed to create participation for SPI test');

      const approve = await requestApi({
        method: 'PUT',
        path: `/participation/approve/${create.data.data._id}`,
        token: state.teacherAToken,
        body: { status: 'Approved' }
      });
      assertStatus(approve, 200, 'Failed to approve participation for SPI test');

      const after = await requestApi({
        method: 'GET',
        path: `/students/${state.student8AUID}/dashboard`,
        token: state.adminToken
      });
      assertStatus(after, 200, 'Failed to fetch dashboard after participation approval');

      const afterParticipationScore = Number(after.data.data.spi.participationScore);

      assert(
        afterParticipationScore > beforeParticipationScore || beforeParticipationScore === 100,
        `Participation score did not increase as expected (${beforeParticipationScore} -> ${afterParticipationScore})`
      );

      return `${beforeParticipationScore} -> ${afterParticipationScore}`;
    });

    await runTest('Principal views analytics', async () => {
      const response = await requestApi({
        method: 'GET',
        path: '/principal/analytics',
        token: state.principalToken
      });
      assertStatus(response, 200, 'Principal analytics fetch failed');
      return `totalStudents=${response.data.data.totalStudents}`;
    });

    await runTest('PDF student card generation endpoint', async () => {
      const response = await requestApi({
        method: 'GET',
        path: `/student/${state.student8AUID}/card`,
        token: state.teacherAToken
      });

      assertStatus(response, 200, 'Student card endpoint failed');
      assert(
        String(response.contentType).includes('application/pdf'),
        `Expected application/pdf content type, got ${response.contentType}`
      );
      assert(response.buffer && response.buffer.length > 100, 'Expected non-empty PDF buffer');
      return `pdfBytes=${response.buffer.length}`;
    });

    await runTest('QR code endpoint', async () => {
      const response = await requestApi({
        method: 'GET',
        path: `/student/${state.student8AUID}/qrcode`,
        token: state.teacherAToken
      });

      assertStatus(response, 200, 'QR endpoint failed');
      assert(
        String(response.contentType).includes('image/png'),
        `Expected image/png content type, got ${response.contentType}`
      );
      assert(response.buffer && response.buffer.length > 100, 'Expected non-empty PNG buffer');
      return `pngBytes=${response.buffer.length}`;
    });

    await runTest('Public verification endpoint returns limited fields', async () => {
      const response = await requestApi({
        method: 'GET',
        path: `/public/student/${state.student8AUID}`
      });

      assertStatus(response, 200, 'Public verification endpoint failed');
      const payload = response.data.data;

      assert(payload.name, 'Expected name in public payload');
      assert(payload.class, 'Expected class in public payload');
      assert(payload.section, 'Expected section in public payload');
      assert(payload.spi !== undefined, 'Expected spi in public payload');
      assert(Array.isArray(payload.topAchievements), 'Expected topAchievements array');
      assert(payload.verificationStatus, 'Expected verificationStatus in payload');

      assert(payload.email === undefined, 'Public payload must not expose email');
      assert(payload.familyIncome === undefined, 'Public payload must not expose family income');
      assert(payload.aadhaar === undefined, 'Public payload must not expose aadhaar');
      assert(payload.aadhaarHash === undefined, 'Public payload must not expose aadhaar hash');
      assert(payload.parentContact === undefined, 'Public payload must not expose parent contact');
      return `verificationStatus=${payload.verificationStatus}`;
    });

    await runTest('Role change setup: teacher approves participation with class-teacher role', async () => {
      const create = await requestApi({
        method: 'POST',
        path: '/participation',
        token: state.teacherAToken,
        body: {
          studentUID: state.student8AUID,
          activityName: 'Role Change Pre-Removal Event',
          category: 'service',
          date: '2026-03-18'
        }
      });
      assertStatus(create, 201, 'Failed to create participation before role removal');

      const approve = await requestApi({
        method: 'PUT',
        path: `/participation/approve/${create.data.data._id}`,
        token: state.teacherAToken,
        body: { status: 'Approved' }
      });
      assertStatus(approve, 200, 'Teacher should approve before role removal');
      return `participationId=${create.data.data._id}`;
    });

    await runTest('Admin removes class teacher role from 8A', async () => {
      const teachersResponse = await requestApi({
        method: 'GET',
        path: '/admin/teachers',
        token: state.adminToken
      });
      assertStatus(teachersResponse, 200, 'Failed to fetch teachers for role removal');

      const asha = (teachersResponse.data.data.teachers || []).find((teacher) => teacher.teacherID === 'T101');
      assert(asha, 'Could not find teacher T101');

      const mapping = (asha.assignments || []).find(
        (item) => item.role === 'ClassTeacher' && item.class === '8A'
      );
      assert(mapping?._id, 'Could not find ClassTeacher mapping for T101 in 8A');

      state.classTeacher8AMappingId = mapping._id;

      const removeResponse = await requestApi({
        method: 'DELETE',
        path: `/admin/teacher-role/${state.classTeacher8AMappingId}`,
        token: state.adminToken
      });
      assertStatus(removeResponse, 200, 'Failed to remove class teacher role');
      return `mappingId=${state.classTeacher8AMappingId}`;
    });

    await runTest('Role change test: removed teacher cannot approve again', async () => {
      const create = await requestApi({
        method: 'POST',
        path: '/participation',
        token: state.teacherAToken,
        body: {
          studentUID: state.student8AUID,
          activityName: 'Role Change Post-Removal Event',
          category: 'service',
          date: '2026-03-19'
        }
      });
      assertStatus(create, 201, 'Teacher should still create participation with subject-teacher assignment');

      const approve = await requestApi({
        method: 'PUT',
        path: `/participation/approve/${create.data.data._id}`,
        token: state.teacherAToken,
        body: { status: 'Approved' }
      });
      assertStatus(approve, 403, 'Teacher should be forbidden after class-teacher role removal');
    });

    await runTest('Audit log entry: teacher-role-assigned', async () => {
      state.finalAudit = await getAuditCounts();
      const before = state.baselineAudit['teacher-role-assigned'];
      const after = state.finalAudit['teacher-role-assigned'];
      assert(after > before, `Expected teacher-role-assigned logs to increase (${before} -> ${after})`);
      return `${before} -> ${after}`;
    });

    await runTest('Audit log entry: achievement-verified', async () => {
      const before = state.baselineAudit['achievement-verified'];
      const after = state.finalAudit['achievement-verified'];
      assert(after > before, `Expected achievement-verified logs to increase (${before} -> ${after})`);
      return `${before} -> ${after}`;
    });

    await runTest('Audit log entry: academic-record-added', async () => {
      const before = state.baselineAudit['academic-record-added'];
      const after = state.finalAudit['academic-record-added'];
      assert(after > before, `Expected academic-record-added logs to increase (${before} -> ${after})`);
      return `${before} -> ${after}`;
    });

    await runTest('Audit log entry: participation-approved', async () => {
      const before = state.baselineAudit['participation-approved'];
      const after = state.finalAudit['participation-approved'];
      assert(after > before, `Expected participation-approved logs to increase (${before} -> ${after})`);
      return `${before} -> ${after}`;
    });

    await runTest('Audit log entry: profile-completed', async () => {
      const before = state.baselineAudit['profile-completed'];
      const after = state.finalAudit['profile-completed'];
      assert(after > before, `Expected profile-completed logs to increase (${before} -> ${after})`);
      return `${before} -> ${after}`;
    });

    await runTest('Audit log entry: scheme-created', async () => {
      const before = state.baselineAudit['scheme-created'];
      const after = state.finalAudit['scheme-created'];
      assert(after > before, `Expected scheme-created logs to increase (${before} -> ${after})`);
      return `${before} -> ${after}`;
    });

    await runTest('Audit log entry: student-card-generated', async () => {
      const before = state.baselineAudit['student-card-generated'];
      const after = state.finalAudit['student-card-generated'];
      assert(after > before, `Expected student-card-generated logs to increase (${before} -> ${after})`);
      return `${before} -> ${after}`;
    });

    await runTest('Audit log entry: public-verification-requested', async () => {
      const before = state.baselineAudit['public-verification-requested'];
      const after = state.finalAudit['public-verification-requested'];
      assert(
        after > before,
        `Expected public-verification-requested logs to increase (${before} -> ${after})`
      );
      return `${before} -> ${after}`;
    });
  } catch (fatalError) {
    console.log(`FAIL | TEST RUN ABORTED | ${fatalError.message}`);
  } finally {
    if (connected) {
      await mongoose.disconnect();
    }

    const total = results.length;
    const passed = results.filter((item) => item.status === 'PASS').length;
    const failed = total - passed;

    console.log('\n===== EDGE CASE TEST SUMMARY =====');
    console.log(`Total tests run: ${total}`);
    console.log(`Tests passed: ${passed}`);
    console.log(`Tests failed: ${failed}`);

    if (failed > 0) {
      process.exitCode = 1;
    }
  }
};

await main();
