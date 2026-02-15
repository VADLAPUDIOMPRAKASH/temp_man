import 'dotenv/config';
import app from './app';
import { connectDB } from './config/db';

const PORT = process.env.PORT || 5001;

// Initialize database connection
connectDB().catch((err) => {
  console.error('Failed to connect to database:', err);
});



// For local development
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
