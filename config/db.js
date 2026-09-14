const mongoose = require('mongoose');

// Cache the connection across invocations. This matters a lot on
// Vercel: each serverless invocation can reuse a warm container, and
// without caching we'd try to open a brand-new MongoDB connection on
// every single request, quickly exhausting Atlas's connection limit.
let cached = global._mongooseConnection;

if (!cached) {
  cached = global._mongooseConnection = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set. Check your .env file.');
  }

  if (!cached.promise) {
    mongoose.set('strictQuery', true);
    cached.promise = mongoose
      .connect(process.env.MONGODB_URI, { maxPoolSize: 10 })
      .then((mongooseInstance) => {
        console.log('MongoDB connected:', mongooseInstance.connection.host);
        return mongooseInstance;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

module.exports = connectDB;
