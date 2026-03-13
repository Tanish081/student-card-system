import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI is required in environment variables');
  process.exit(1);
}

await connectDB(MONGO_URI);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
