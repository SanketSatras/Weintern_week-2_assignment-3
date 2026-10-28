/**
 * Database Configuration
 * Manages Mongoose connection to MongoDB with connection pooling and error handling.
 */
const mongoose = require('mongoose');
const dns = require('dns');

// Prevent querySrv ECONNREFUSED issues on networks/routers where default DNS fails on SRV records
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch {
  // Ignore in environments where setting DNS servers is restricted
}

const connectDB = async (customUri) => {
  try {
    const mongoUri = customUri || process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MongoDB connection URI is not defined in environment variables.');
    }

    // Set Mongoose options for production readiness
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(mongoUri, {
      autoIndex: true, // Build indexes (unique email)
    });

    // Safe logging: log host and database name, NEVER credentials or full connection string with auth
    const host = conn.connection.host;
    const dbName = conn.connection.name;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[Database] MongoDB connected successfully: host=${host}, database=${dbName}`);
    }

    return conn;
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (process.env.NODE_ENV !== 'test') {
      console.log('[Database] MongoDB connection closed.');
    }
  } catch (error) {
    console.error(`[Database Error] Error during disconnection: ${error.message}`);
  }
};

module.exports = { connectDB, disconnectDB };
