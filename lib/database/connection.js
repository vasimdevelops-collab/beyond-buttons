/**
 * Mongoose connection — env-driven.
 *
 * Required: MONGODB_URI
 * Optional: MONGODB_DB_NAME
 */

import mongoose from "mongoose";

const globalForMongoose = globalThis;

/**
 * @returns {Promise<typeof mongoose>}
 */
export async function connectMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (globalForMongoose.__bbMongoPromise) {
    await globalForMongoose.__bbMongoPromise;
    return mongoose;
  }

  const dbName = process.env.MONGODB_DB_NAME || undefined;

  globalForMongoose.__bbMongoPromise = mongoose.connect(uri, {
    dbName,
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });

  try {
    await globalForMongoose.__bbMongoPromise;
    return mongoose;
  } catch (error) {
    globalForMongoose.__bbMongoPromise = null;
    throw error;
  }
}

/**
 * @returns {Promise<void>}
 */
export async function disconnectMongo() {
  globalForMongoose.__bbMongoPromise = null;
  if (mongoose.connection.readyState === 0) return;
  await mongoose.disconnect();
}

/**
 * @returns {boolean}
 */
export function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * @returns {"disconnected"|"connected"|"connecting"|"disconnecting"|string}
 */
export function getMongoReadyState() {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  return states[mongoose.connection.readyState] || "unknown";
}
