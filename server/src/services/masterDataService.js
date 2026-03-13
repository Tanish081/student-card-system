import SchoolClass from '../models/Class.js';
import Section from '../models/Section.js';
import Subject from '../models/Subject.js';

export const parseClassAssignment = (classAssignment = '') => {
  const normalized = String(classAssignment).trim().toUpperCase();
  const match = normalized.match(/^(\d+)([A-Z]+)$/);

  if (!match) {
    return { className: null, sectionName: null };
  }

  return {
    className: match[1],
    sectionName: match[2]
  };
};

export const ensureClassSection = async ({ schoolId, className, sectionName }) => {
  if (!className) {
    return { classDoc: null, sectionDoc: null };
  }

  const normalizedClass = String(className).trim();
  const classDoc = await SchoolClass.findOneAndUpdate(
    { schoolId, name: normalizedClass },
    {
      $setOnInsert: {
        displayName: `Class ${normalizedClass}`
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (!sectionName) {
    return { classDoc, sectionDoc: null };
  }

  const normalizedSection = String(sectionName).trim().toUpperCase();
  const sectionDoc = await Section.findOneAndUpdate(
    { schoolId, classRef: classDoc._id, name: normalizedSection },
    {
      $setOnInsert: {
        label: `${normalizedClass}${normalizedSection}`
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return { classDoc, sectionDoc };
};

export const ensureSubject = async ({ schoolId, subjectName }) => {
  if (!subjectName) return null;

  return Subject.findOneAndUpdate(
    { schoolId, name: String(subjectName).trim() },
    {
      $setOnInsert: {
        code: String(subjectName).trim().slice(0, 4).toUpperCase()
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};
