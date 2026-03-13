# Backend Architecture

## Highlights

- Express + MongoDB clean modular architecture
- JWT authentication + bcrypt password hashing
- RBAC with Principal, Teacher, Student
- Teacher sub-role mapping in `TeacherRole` collection
- Deterministic student UID generation at model level
- SPI scoring service with weighted formula
- Seed script for realistic test data

## Folder Structure

```text
src/
  config/
  controllers/
  middleware/
  models/
  routes/
  services/
  scripts/
  utils/
```

## Key Security Measures

1. Passwords hashed in User model pre-save middleware
2. Protected routes require Bearer JWT tokens
3. Route-level role checks with reusable RBAC middleware
4. Student self-access restrictions enforced

## Future Multi-School Support

All core collections include `schoolId` fields with indexes.
Migrating to multi-school tenancy can be done by assigning school-specific identities and enforcing school context per authenticated user.
