import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

export interface EnvironmentConfig {
  port: number;
  nodeEnv: string;
  mongodbUri: string;
  jwtSecret: string;
  geminiApiKey: string;
}

export const config: EnvironmentConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/medtwin',
  jwtSecret: process.env.JWT_SECRET || 'medtwin_default_dev_secret_key',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
};
