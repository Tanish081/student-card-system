# API Examples

## 1) Register

`POST /api/auth/register`

Request:

```json
{
  "name": "Asha Verma",
  "email": "asha.verma@school.edu",
  "password": "Teacher@123",
  "role": "teacher",
  "teacherID": "T101"
}
```

Response:

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "token": "<JWT>",
    "user": {
      "id": "65f...",
      "name": "Asha Verma",
      "email": "asha.verma@school.edu",
      "role": "teacher",
      "linkedTeacherID": "T101",
      "linkedStudentUID": null
    }
  }
}
```

## 2) Create Student (UID generated in backend)

`POST /api/students`

Request:

```json
{
  "firstName": "Rahul",
  "lastName": "Kumar",
  "dob": "2012-08-15",
  "class": "8",
  "section": "A",
  "admissionYear": 2024
}
```

Response (sample UID `RAH1508201224`):

```json
{
  "success": true,
  "message": "Student created successfully",
  "data": {
    "uid": "RAH1508201224",
    "firstName": "Rahul",
    "lastName": "Kumar",
    "class": "8",
    "section": "A",
    "admissionYear": 2024
  }
}
```

## 3) Add Achievement (points auto-calculated)

`POST /api/achievements`

Request:

```json
{
  "studentUID": "RAH1508201224",
  "eventName": "Inter-School Football Tournament",
  "category": "sports",
  "level": "Inter-school",
  "position": "2nd Prize"
}
```

Response (points = `40 * 1.5 = 60`):

```json
{
  "success": true,
  "message": "Achievement added successfully",
  "data": {
    "studentUID": "RAH1508201224",
    "eventName": "Inter-School Football Tournament",
    "points": 60,
    "status": "Pending"
  }
}
```

## 4) Student Dashboard

`GET /api/students/:uid/dashboard`

Response:

```json
{
  "success": true,
  "message": "Student dashboard fetched successfully",
  "data": {
    "profile": {
      "uid": "RAH1508201224",
      "name": "Rahul Kumar",
      "class": "8",
      "section": "A"
    },
    "spi": {
      "academicScore": 84.33,
      "sportsScore": 40,
      "activityScore": 20,
      "participationScore": 10,
      "spi": 54.95,
      "category": "Needs Support"
    },
    "achievements": [],
    "teacherFeedback": [],
    "participationHistory": []
  }
}
```
