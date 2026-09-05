process.env.MONGO_URI = 'mongodb://placeholder:27017/test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DISCORD_CLIENT_ID = 'test-client-id';
process.env.DISCORD_CLIENT_SECRET = 'test-client-secret';
process.env.DISCORD_REDIRECT_URI = 'http://localhost:5000/api/auth/discord/callback';
process.env.ALLOWED_DISCORD_IDS = '123456789,987654321';
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-api-key';
process.env.CLOUDINARY_API_SECRET = 'test-api-secret';
process.env.NODE_ENV = 'test';
process.env.CLIENT_URL = 'http://localhost:5173';
// Must be set explicitly. env.ts calls `import 'dotenv/config'`, and dotenv only
// fills variables that are absent — so any value left unset here is inherited
// from the developer's real .env, making the suite pass or fail depending on
// local configuration. This one governs the CORS test.
process.env.ALLOWED_ORIGINS = 'http://localhost:5173';

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { beforeAll, afterAll, afterEach } from 'vitest';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGO_URI = uri;
  await mongoose.connect(uri);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
