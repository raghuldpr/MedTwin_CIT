import net from 'net';
import mongoose from 'mongoose';
import { config } from './env.config';
import { logger } from '../utils/logger.util';

export interface DatabaseStatus {
  isConnected: boolean;
  readyState: number;
  host?: string;
  name?: string;
  isInMemory?: boolean;
}

let mongoMemoryServerInstance: any = null;
let isInMemoryDb = false;

/**
 * Checks if a TCP host and port are actively listening.
 */
const isPortOpen = (host: string, port: number, timeoutMs = 300): Promise<boolean> => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let hasResolved = false;

    const done = (result: boolean) => {
      if (!hasResolved) {
        hasResolved = true;
        socket.destroy();
        resolve(result);
      }
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));

    socket.connect(port, host);
  });
};

/**
 * Connect to MongoDB database instance via Mongoose.
 * If running in development and a local daemon is not running, seamlessly
 * initializes an in-memory MongoDB instance for development and tests.
 */
export const connectDatabase = async (): Promise<typeof mongoose> => {
  const uri = config.mongodbUri;

  if (!uri) {
    const error = new Error('MONGODB_URI is not defined in the environment configuration.');
    logger.error(error.message);
    throw error;
  }

  const isLocalhost = uri.includes('localhost') || uri.includes('127.0.0.1');

  try {
    let targetUri = uri;

    if (isLocalhost) {
      const portMatch = uri.match(/:(\d+)/);
      const port = portMatch ? parseInt(portMatch[1], 10) : 27017;
      const isOpen = await isPortOpen('127.0.0.1', port, 300);

      if (!isOpen) {
        if (config.nodeEnv !== 'production') {
          logger.info('Local MongoDB daemon not detected. Starting in-memory MongoDB for development...');
          const { MongoMemoryServer } = await import('mongodb-memory-server');
          mongoMemoryServerInstance = await MongoMemoryServer.create();
          targetUri = mongoMemoryServerInstance.getUri();
          isInMemoryDb = true;
          logger.info('In-memory MongoDB initialized successfully.');
        } else {
          throw new Error(`Cannot connect to MongoDB at ${uri}. Host unreachable.`);
        }
      }
    }

    logger.info(`Connecting to MongoDB...`);
    const connection = await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 5000,
      dbName: 'medtwin',
    });

    // Attach runtime listeners after initial connection is successfully established
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB runtime connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB connection disconnected.');
    });

    logger.info(
      `MongoDB connected successfully to database: ${connection.connection.name || 'medtwin'}${
        isInMemoryDb ? ' (In-Memory Development Mode)' : ''
      }`
    );

    return connection;
  } catch (error) {
    logger.error('Failed to establish MongoDB database connection:', error);
    throw error;
  }
};

/**
 * Gracefully disconnect from MongoDB and stop in-memory server if running.
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      logger.info('MongoDB disconnected cleanly.');
    }

    if (mongoMemoryServerInstance) {
      await mongoMemoryServerInstance.stop();
      mongoMemoryServerInstance = null;
      logger.info('In-memory MongoDB stopped cleanly.');
    }
  } catch (error) {
    logger.error('Error during MongoDB disconnect:', error);
    throw error;
  }
};

/**
 * Check current database connection status.
 */
export const getDatabaseStatus = (): DatabaseStatus => {
  const readyState = mongoose.connection.readyState;
  return {
    isConnected: readyState === 1,
    readyState,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
    isInMemory: isInMemoryDb,
  };
};
