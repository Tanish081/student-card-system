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
import cardRoutes from './routes/cardRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is healthy' });
});

app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/student', cardRoutes);
app.use('/api/schemes', schemeRoutes);
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
