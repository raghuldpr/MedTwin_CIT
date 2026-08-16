import { Server } from 'http';
import { app } from './app';
import { config, connectDatabase, disconnectDatabase } from './config';
import { logger } from './utils';
import { seedMasterData } from './scripts/seed';

const PORT = config.port || 3000;
const HOST = '0.0.0.0';

let server: Server | null = null;

/**
 * Application startup lifecycle:
 * 1. Load configuration
 * 2. Connect to MongoDB
 * 3. Auto-seed demo dataset (Patient, Doctor, Admin)
 * 4. Start Express HTTP server
 */
const startServer = async (): Promise<void> => {
  try {
    logger.info('Starting MedTwin backend initialization...');

    // Connect to MongoDB before accepting incoming network requests
    await connectDatabase();

    // Auto-seed demo accounts & clinical dataset into in-memory database
    try {
      await seedMasterData();
    } catch (seedErr) {
      logger.warn('Auto-seeding encountered a non-blocking error:', seedErr);
    }

    // Start Express HTTP Server
    server = app.listen(PORT, HOST, () => {
      logger.info(`MedTwin Server running in ${config.nodeEnv} mode on http://${HOST}:${PORT}`);
      logger.info(`Health check endpoint: http://${HOST}:${PORT}/api/health`);
    });
  } catch (error) {
    logger.error('Failed to start MedTwin server due to database connection error:', error);
    process.exit(1);
  }
};

// Process-level error and unhandled rejection guards
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful Shutdown Coordinator
let isShuttingDown = false;

const handleShutdown = async (signal: string): Promise<void> => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`Received ${signal}. Initiating graceful shutdown...`);

  if (server) {
    server.close(async (serverErr) => {
      if (serverErr) {
        logger.error('Error while closing HTTP server:', serverErr);
      } else {
        logger.info('HTTP server closed. No longer accepting new connections.');
      }

      try {
        await disconnectDatabase();
        logger.info('MongoDB connection terminated cleanly.');
      } catch (dbErr) {
        logger.error('Error while closing MongoDB connection:', dbErr);
      } finally {
        logger.info('MedTwin shutdown complete.');
        process.exit(0);
      }
    });
  } else {
    try {
      await disconnectDatabase();
    } catch {
      // Ignore disconnect errors if server didn't start
    }
    process.exit(0);
  }
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

// Initiate startup sequence
startServer();

export { server, startServer };
export default server;
