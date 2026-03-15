import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const opportunitiesDir = path.resolve(__dirname, '../../uploads/opportunities');

fs.mkdirSync(opportunitiesDir, { recursive: true });

const allowedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, opportunitiesDir),
  filename: (_req, file, cb) => {
    const safeName = String(file.originalname || 'file')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const fileFilter = (_req, file, cb) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    const error = new Error(`Unsupported file type: ${file.mimetype}`);
    error.statusCode = 400;
    return cb(error);
  }
  return cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 4 * 1024 * 1024,
    files: 5
  }
});

export const uploadOpportunityAttachments = upload.array('attachments', 5);
