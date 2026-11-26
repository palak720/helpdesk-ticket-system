import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';

const { MONGO_URI, ADMIN_NAME = 'Admin', ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Set MONGO_URI, ADMIN_EMAIL and ADMIN_PASSWORD in .env');
  process.exit(1);
}

await mongoose.connect(MONGO_URI);
const email = ADMIN_EMAIL.toLowerCase();
if (await User.exists({ email })) {
  console.log('Admin already exists:', email);
} else {
  await User.create({ name: ADMIN_NAME, email, password: ADMIN_PASSWORD, role: 'admin' });
  console.log('Admin created:', email);
}
await mongoose.disconnect();
