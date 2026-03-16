import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import cloudinary, { ensureCloudinaryConfigured } from '../config/cloudinary.js';
import Opportunity from '../models/Opportunity.js';

dotenv.config();

const uploadsDir = path.resolve(process.cwd(), 'uploads/opportunities');

const run = async () => {
  ensureCloudinaryConfigured();

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI or MONGODB_URI is required');
  }

  await connectDB(mongoUri);

  const opportunities = await Opportunity.find({
    'attachments.fileUrl': { $regex: '^/uploads/opportunities/' }
  });

  let migrated = 0;

  for (const opportunity of opportunities) {
    let changed = false;

    for (const attachment of opportunity.attachments || []) {
      if (!attachment.fileUrl || !attachment.fileUrl.startsWith('/uploads/opportunities/')) continue;

      const fileName = attachment.fileUrl.replace('/uploads/opportunities/', '');
      const localPath = path.join(uploadsDir, fileName);
      if (!fs.existsSync(localPath)) continue;

      const uploadResponse = await cloudinary.uploader.upload(localPath, {
        folder: 'student-platform/opportunities',
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true
      });

      attachment.fileUrl = uploadResponse.secure_url;
      attachment.dataUrl = null;
      changed = true;
      migrated += 1;
    }

    if (changed) {
      await opportunity.save();
    }
  }

  await mongoose.disconnect();
  console.log(`Migration complete. Attachments migrated: ${migrated}`);
};

run().catch(async (error) => {
  console.error('Migration failed:', error.message);
  await mongoose.disconnect();
  process.exit(1);
});
