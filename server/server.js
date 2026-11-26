import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';

const { PORT = 5000, MONGO_URI, JWT_SECRET } = process.env;

if (!MONGO_URI || !JWT_SECRET) {
  console.error('MONGO_URI and JWT_SECRET must be set in .env');
  process.exit(1);
}

connectDB(MONGO_URI)
  .then(() => app.listen(PORT, () => console.log(`API running on port ${PORT}`)))
  .catch((err) => {
    console.error('Failed to start:', err.message);
    process.exit(1);
  });
