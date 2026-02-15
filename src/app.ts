import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import boardRoutes from './routes/boards';
import listRoutes from './routes/lists';
import cardRoutes from './routes/cards';
import memberRoutes from './routes/members';
import searchRoutes from './routes/search';
import uploadRoutes from './routes/upload';

const app = express();

// CORS configuration using environment variable
// Supports multiple origins for development and production
const allowedOrigins = [
  'http://localhost:3000',                      // Local development
  process.env.FRONTEND_URL,                     // Additional frontend URL from env
].filter(Boolean); // Remove undefined values

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/boards/:boardId/lists', listRoutes);
app.use('/api/boards/:boardId/cards', cardRoutes);
app.use('/api/boards/:boardId/members', memberRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api/health', (_, res) => res.json({ ok: true }));

export default app;
