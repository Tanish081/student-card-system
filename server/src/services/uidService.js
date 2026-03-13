import Counter from '../models/Counter.js';

const padName = (firstName = '') => {
  const normalized = firstName.replace(/[^a-zA-Z]/g, '').toUpperCase();
  if (!normalized) return 'STD';
  return normalized.slice(0, 3).padEnd(3, 'X');
};

const formatDatePart = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid DOB provided for UID generation');
  }

  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = String(date.getFullYear());

  return `${dd}${mm}${yyyy}`;
};

const getNextStudentSerial = async () => {
  const counter = await Counter.findOneAndUpdate(
    { name: 'studentSerial' },
    { $inc: { value: 1 } },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );

  return String(counter.value).padStart(4, '0');
};

export const generateStudentUID = async ({ firstName, dob, admissionYear }) => {
  const serialPart = await getNextStudentSerial();
  const namePart = padName(firstName);
  const dobPart = formatDatePart(dob);
  const admissionYearPart = String(admissionYear);

  return `${serialPart}-${namePart}-${dobPart}-${admissionYearPart}`;
};
