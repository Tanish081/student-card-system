# Demo Flow - School Student Performance System

This walkthrough demonstrates the complete lifecycle from account creation to public verification.

## 1) Admin creates teacher
- Login as admin.
- Call `POST /api/admin/create-teacher`.
- Then assign role with `PUT /api/admin/assign-teacher-role`.

## 2) Admin creates student
- Call `POST /api/admin/create-student`.
- Capture generated `student.uid` for all next steps.

## 3) Student logs in and completes profile
- Login using `POST /api/auth/login` (observe `profileCompletionRequired: true`).
- Call `POST /api/students/complete-profile`.
- Re-login to verify `profileCompletionRequired: false`.

## 4) Teacher adds achievement
- Teacher calls `POST /api/achievements` for the student.

## 5) Teacher records participation
- Teacher calls `POST /api/participation`.

## 6) Class teacher approves participation
- Class teacher calls `PUT /api/participation/approve/:id` with `Approved`.

## 7) SPI updates
- Verify updated student score via `GET /api/students/:uid/dashboard`.

## 8) Principal views analytics
- Principal checks:
  - `GET /api/principal/analytics`
  - `GET /api/principal/spi`
  - `GET /api/principal/top-students`

## 9) Student downloads card
- Call `GET /api/student/:uid/card`.
- Confirm PDF includes profile, performance, achievements, and QR section.

## 10) QR verification endpoint confirms identity
- Retrieve QR with `GET /api/student/:uid/qrcode`.
- Scan QR; it should resolve to `/api/public/student/:uid`.
- Public endpoint should expose only non-sensitive fields.
