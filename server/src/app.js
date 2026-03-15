import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import achievementRoutes from './routes/achievementRoutes.js';
import spiRoutes from './routes/spiRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import principalRoutes from './routes/principalRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import participationRoutes from './routes/participationRoutes.js';
import studentProfileRoutes from './routes/studentProfileRoutes.js';
import schemeRoutes from './routes/schemeRoutes.js';
import opportunityRoutes from './routes/opportunityRoutes.js';
import cardRoutes from './routes/cardRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';

const app = express();

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((origin) => origin.trim()).filter(Boolean)
  : ['http://localhost:5173'];

const allowVercelPreviews = process.env.ALLOW_VERCEL_PREVIEWS === 'true';

const isAllowedOrigin = (origin) => {
  if (allowedOrigins.includes(origin)) return true;
  if (allowVercelPreviews && /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return true;
  return false;
};

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    if (isAllowedOrigin(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is healthy' });
});

app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/student', cardRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/students', studentProfileRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/spi', spiRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/principal', principalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/participation', participationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
