import "server-only";
import mongoose from "mongoose";

// 把連線存在 globalThis，避免開發時熱更新、或 Vercel Serverless 每次請求都重新連線
type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cache: MongooseCache = globalForMongoose.mongooseCache ?? { conn: null, promise: null };
globalForMongoose.mongooseCache = cache;

export async function connectDB() {
  if (cache.conn) return cache.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("尚未設定環境變數 MONGODB_URI，請在 .env.local 中設定");
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, {
      bufferCommands: false, // 沒連上時直接報錯，不要卡住等待
      serverSelectionTimeoutMS: 10000,
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    // 連線失敗時清掉，下次請求才能重試
    cache.promise = null;
    throw error;
  }

  return cache.conn;
}
