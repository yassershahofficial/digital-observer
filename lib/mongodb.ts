import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

// Only throw error if we're not in build mode and URI is missing
if (!MONGODB_URI) {
  // During build, Next.js might not have MONGODB_URI, which is okay
  if (process.env.NEXT_PHASE !== 'phase-production-build' && process.env.NODE_ENV !== 'production') {
    throw new Error(
      'Please define the MONGODB_URI environment variable inside .env.local'
    );
  }
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // Return early if no URI is provided (e.g., during build)
  if (!MONGODB_URI) {
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
