import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || '');
  console.log('Connected to DB:', mongoose.connection.name);
  if (!mongoose.connection.db) {
    console.log('No DB reference');
    return;
  }
  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const c of collections) {
    const count = await mongoose.connection.db.collection(c.name).countDocuments();
    console.log(`  ${c.name}: ${count}`);
  }
  await mongoose.disconnect();
}
run();
