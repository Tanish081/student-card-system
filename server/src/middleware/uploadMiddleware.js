import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary, { ensureCloudinaryConfigured } from '../config/cloudinary.js';

const allowedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, file) => {
    const safeName = String(file.originalname || 'file')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');

    return {
      folder: 'student-platform/opportunities',
      resource_type: 'auto',
      public_id: `opportunity-${Date.now()}-${safeName}`
    };
  }
});

const fileFilter = (_req, file, cb) => {
  try {
    ensureCloudinaryConfigured();
  } catch (error) {
    return cb(error);
  }

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
