# School Student Performance and Achievement Management System (MERN)

Production-ready MERN foundation for tracking student performance for a single school (Class 6 to 10), designed to scale to multi-school tenancy later.

## Technology Stack

- Frontend: React + Vite + Axios + Recharts
- Backend: Node.js + Express.js
- Database: MongoDB + Mongoose
- Authentication: JWT
- Password Security: bcrypt hashing
- Authorization: RBAC (Principal, Teacher, Student)

## Core Capabilities

- Deterministic UID generation for students in backend
- Teacher sub-role/class mapping (`ClassTeacher`, `SubjectTeacher`, `SportsTeacher`)
- Achievement entry + verification workflow (`Pending`, `Approved`, `Rejected`)
- Achievement points formula
- Academic record entry with role-class-subject checks
- Student Potential Index (SPI) computation and categorying
- Dashboards for Student, Teacher (including class teacher actions), Principal analytics

## Student UID Algorithm

```text
UID = firstName.substring(0,3).toUpperCase() + DOB_DDMMYYYY + admissionYear_last2digits
Example: Rahul, 15-Aug-2012, 2024 -> RAH1508201224
```

## Achievement Points Formula

```text
FinalPoints = BasePoints * LevelMultiplier
```

Base Points:

- Participation: 5
- 3rd Prize: 30
- 2nd Prize: 40
- 1st Prize: 50

Level Multiplier:

- School: 1
- Inter-school: 1.5
- District: 2
- State: 3
- National: 5

## SPI Formula

```text
SPI = 0.45*AcademicScore + 0.30*SportsScore + 0.15*ActivityScore + 0.10*ParticipationScore
```

SPI categories:

- 90–100: Exceptional
- 75–89: High Potential
- 60–74: Developing
- 40–59: Needs Support
- Below 40: At Risk

## Project Structure

```text
server/
  src/
    config/
    controllers/
    middleware/
    models/
    routes/
    services/
    scripts/
    utils/
client/
  src/
    components/
    context/
    hooks/
    pages/
    routes/
    services/
    styles/
```

## Setup

1. Copy environment templates:
   - `server/.env.example` -> `server/.env`
   - `client/.env.example` -> `client/.env`
2. Set MongoDB URI and JWT secret in `server/.env`
3. Install dependencies:

```bash
npm run install:all
```

4. Seed test data:

```bash
npm run seed
```

5. Run backend:

```bash
npm run dev:server
```

6. Run frontend:

```bash
npm run dev:client
```

## Seed Credentials

- Principal: `principal@school.edu` / `Principal@123`
- Teacher: `asha.verma@school.edu` / `Teacher@123`
- Student: `rahul.rah1508201224@student.school.edu` / `Student@123`

## Key API Routes

- Auth
  - `POST /api/auth/register`
  - `POST /api/auth/login`
- Students
  - `POST /api/students`
  - `GET /api/students`
  - `GET /api/students/:uid`
  - `GET /api/students/:uid/dashboard`
- Achievements
  - `POST /api/achievements`
  - `GET /api/achievements/student/:uid`
  - `PATCH /api/achievements/:achievementId/verify`
- Teacher
  - `GET /api/teachers/me/assignments`
  - `GET /api/teachers/me/students`
  - `POST /api/teachers/roles`
  - `GET /api/teachers/roles/:teacherID`
  - `POST /api/teachers/academic-records`
  - `GET /api/teachers/academic-records/student/:uid`
  - `POST /api/teachers/guidance`
- SPI
  - `GET /api/spi/student/:uid`
  - `GET /api/spi/class/:classId`
- Principal
  - `GET /api/principal/analytics`

## Notes on Multi-School Expansion

Most collections include `schoolId` and the auth context carries `schoolId`. Expanding to multiple schools is mainly a tenancy and provisioning task without major schema redesign.

## Extra Reference

- API response examples: `server/API_EXAMPLES.md`
- Backend architecture notes: `server/src/README_BACKEND.md`
