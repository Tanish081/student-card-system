# School Student Performance System - API Documentation

Base URL: `http://localhost:5000`

## Standard Response Format

### Success
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

### Error
```json
{
  "success": false,
  "message": "Error message",
  "errorCode": "ERROR_TYPE",
  "errors": null
}
```

---

## Authentication

### POST /api/auth/login
- Authentication: No
- Description: Logs in user and returns JWT token.
- Example Request:
```json
{
  "email": "admin@school.edu",
  "password": "Admin@123"
}
```
- Example Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "<jwt>",
    "profileCompletionRequired": false,
    "user": {
      "id": "...",
      "name": "School Admin",
      "email": "admin@school.edu",
      "role": "admin"
    }
  }
}
```

### POST /api/auth/register
- Authentication: Yes (Admin)
- Description: Registers a user account mapped to teacherID or studentUID.
- Example Request:
```json
{
  "name": "Demo Student",
  "email": "demo.student@test.com",
  "password": "Student@123",
  "role": "student",
  "studentUID": "0001-RAH-15082012-2024"
}
```
- Example Response:
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "token": "<jwt>",
    "user": {
      "id": "...",
      "name": "Demo Student",
      "email": "demo.student@test.com",
      "role": "student",
      "linkedStudentUID": "0001-RAH-15082012-2024"
    }
  }
}
```

---

## Admin

### POST /api/admin/create-teacher
- Authentication: Yes (Admin)
- Description: Creates teacher + user account.
- Example Request:
```json
{
  "name": "Asha Verma",
  "email": "asha.demo@test.com",
  "password": "Teacher@123"
}
```
- Example Response: `success/message/data.user/data.teacher`

### POST /api/admin/create-student
- Authentication: Yes (Admin)
- Description: Creates student + user account with generated UID.
- Example Request (working API body):
```json
{
  "firstName": "Rahul",
  "lastName": "Sharma",
  "dob": "2012-08-15",
  "class": "8",
  "section": "A",
  "admissionYear": 2024,
  "email": "rahul.student@test.com",
  "password": "Student@123"
}
```
- Example Request (demo alias format):
```json
{
  "firstName": "Rahul",
  "lastName": "Sharma",
  "dateOfBirth": "2012-08-15",
  "class": "8",
  "section": "A",
  "admissionYear": 2024,
  "email": "rahul.student@test.com",
  "password": "Student@123"
}
```
- Example Response: `success/message/data.user/data.student`

### PUT /api/admin/assign-teacher-role
- Authentication: Yes (Admin)
- Description: Assigns teacher sub-role (`ClassTeacher`, `SubjectTeacher`, `SportsTeacher`).
- Example Request:
```json
{
  "teacherID": "T101",
  "role": "ClassTeacher",
  "class": "8A"
}
```
- Example Response: `success/message/data`

### DELETE /api/admin/teacher-role/:mappingId
- Authentication: Yes (Admin)
- Description: Removes teacher role mapping.
- Example Response: `success/message/data`

### GET /api/admin/teachers
- Authentication: Yes (Admin)
- Description: List all teachers.
- Example Response: `success/message/data.count/data.teachers`

### GET /api/admin/students
- Authentication: Yes (Admin)
- Description: List all students.
- Example Response: `success/message/data.count/data.students`

---

## Student

### POST /api/students/complete-profile
- Authentication: Yes (Student)
- Description: Completes student profile (first-login flow) and hashes Aadhaar if supplied.
- Example Request:
```json
{
  "gender": "Male",
  "address": "Sector 15",
  "city": "Pune",
  "state": "Maharashtra",
  "pincode": "411001",
  "parentName": "Ramesh Sharma",
  "parentContact": "9876543210",
  "familyIncome": 280000,
  "category": "General"
}
```
- Example Response:
```json
{
  "success": true,
  "message": "Student profile completed successfully",
  "data": {
    "studentUID": "0008-PRO-10072013-2024",
    "profileCompleted": true
  }
}
```

### GET /api/students/:uid
- Authentication: Yes (Student self / Admin / Teacher)
- Description: Gets student profile by UID.
- Example Response: `success/message/data`

---

## Teacher

### GET /api/teachers/me/assignments
- Authentication: Yes (Teacher)
- Description: Fetches teacher role mappings.

### GET /api/teachers/me/students
- Authentication: Yes (Teacher)
- Description: Fetches students mapped to teacher classes.

### GET /api/teachers/roles/:teacherID
- Authentication: Yes (Teacher self or Admin)
- Description: Fetches teacher role mapping by teacherID.

### POST /api/teachers/academic-records
- Authentication: Yes (Teacher)
- Description: Adds academic record for mapped student.
- Example Request:
```json
{
  "studentUID": "0001-RAH-15082012-2024",
  "subject": "Math",
  "marks": 86,
  "examType": "Midterm"
}
```

### PATCH /api/teachers/academic-records/:recordId
- Authentication: Yes (Teacher)
- Description: Updates only records created by same teacher.

### GET /api/teachers/academic-records/student/:uid
- Authentication: Yes (Student self / Admin / Teacher)
- Description: Fetches academic records by student UID.

### POST /api/teachers/guidance
- Authentication: Yes (Teacher)
- Description: Adds guidance note for student.

---

## Participation

### POST /api/participation
- Authentication: Yes (Teacher)
- Description: Adds participation as pending.
- Example Request:
```json
{
  "studentUID": "0001-RAH-15082012-2024",
  "activityName": "Inter-house debate",
  "category": "activity",
  "date": "2026-03-14"
}
```

### PUT /api/participation/approve/:id
- Authentication: Yes (Teacher, class-teacher role)
- Description: Approves/rejects participation.
- Example Request:
```json
{
  "status": "Approved"
}
```

### GET /api/participation/student/:uid
- Authentication: Yes (Student self / Admin / Teacher)
- Description: Fetches participation history.

---

## Achievements

### POST /api/achievements
- Authentication: Yes (Teacher)
- Description: Adds achievement (pending verification).
- Example Request:
```json
{
  "studentUID": "0001-RAH-15082012-2024",
  "eventName": "District Chess Winner",
  "category": "extracurricular",
  "level": "District",
  "position": "1st Prize",
  "certificateURL": "https://example.com/certificate.pdf"
}
```

### PATCH /api/achievements/:achievementId/verify
- Authentication: Yes (Teacher, class-teacher role)
- Description: Verifies achievement (`Approved` or `Rejected`).

### GET /api/achievements/student/:uid
- Authentication: Yes (Student self / Admin / Teacher)
- Description: Fetches achievement history.

---

## Schemes

### POST /api/schemes
- Authentication: Yes (Admin)
- Description: Creates government scheme criteria.
- Example Request:
```json
{
  "schemeName": "National Means Merit Scholarship",
  "description": "Scholarship for meritorious students",
  "minAcademicScore": 75,
  "minSPI": 70,
  "maxFamilyIncome": 350000,
  "eligibleClasses": ["8", "9"],
  "sportsRequired": false,
  "activityRequired": false,
  "active": true
}
```

### GET /api/schemes
- Authentication: Yes (Admin / Principal / Teacher / Student)
- Description: Lists all schemes.

### GET /api/schemes/:id
- Authentication: Yes (Admin / Principal / Teacher / Student)
- Description: Gets scheme by id.

### GET /api/schemes/eligible/:studentUID
- Authentication: Yes (Admin / Principal / Teacher / Student self)
- Description: Returns eligibility evaluation and matched schemes.

---

## Cards

### GET /api/student/:uid/card
- Authentication: Yes (Admin / Principal / Teacher / Student self)
- Description: Downloads student achievement card PDF.
- Response Content-Type: `application/pdf`

### GET /api/student/:uid/qrcode
- Authentication: Yes (Admin / Principal / Teacher / Student self)
- Description: Returns QR image for public verification endpoint.
- Response Content-Type: `image/png`

---

## Public Verification

### GET /api/public/student/:uid
- Authentication: No
- Description: Public verification endpoint with non-sensitive fields only.
- Example Response:
```json
{
  "success": true,
  "message": "Public student verification fetched successfully",
  "data": {
    "name": "Rahul Sharma",
    "class": "8",
    "section": "A",
    "spi": 78,
    "topAchievements": [
      {
        "eventName": "District Chess Winner",
        "level": "District",
        "position": "1st Prize",
        "points": 100
      }
    ],
    "verificationStatus": "Verified"
  }
}
```

---

## Principal Analytics

### GET /api/principal/analytics
- Authentication: Yes (Principal)
- Description: Full analytics dashboard dataset.

### GET /api/principal/spi
- Authentication: Yes (Principal)
- Description: SPI ranking + students needing support.

### GET /api/principal/top-students
- Authentication: Yes (Principal)
- Description: Top performers by SPI, academics, and sports.
