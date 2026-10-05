import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

let mongoServer: MongoMemoryServer | null = null;

export const connectTestDB = async () => {
  if (mongoose.connection.readyState === 0) {
    try {
      mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      await mongoose.connect(uri);
    } catch (err) {
      console.log('MongoMemoryServer fallback to remote MongoDB URI for testing');
      const testUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/diws_test';
      await mongoose.connect(testUri, { dbName: 'diws_test_db' });
    }
    await User.syncIndexes().catch(() => {});
  }
};

export const disconnectTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop().catch(() => {});
    mongoServer = null;
  }
};

export const clearTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
};
