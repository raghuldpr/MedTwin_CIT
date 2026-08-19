import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env.config';
import { connectDatabase, disconnectDatabase, getDatabaseStatus } from '../config/database.config';

async function testConfiguration() {
  console.log('====================================================');
  console.log('       MedTwin Backend Configuration Diagnostic    ');
  console.log('====================================================\n');

  console.log('📋 Loaded Environment Variables:');
  console.log(` - PORT:            ${config.port}`);
  console.log(` - NODE_ENV:        ${config.nodeEnv}`);
  console.log(` - MONGODB_URI:     ${config.mongodbUri}`);
  console.log(` - JWT_SECRET:      ${config.jwtSecret ? '****** (Set)' : 'NOT SET'}`);
  console.log(` - GEMINI_API_KEY:  ${config.geminiApiKey ? (config.geminiApiKey === 'your_gemini_api_key_here' ? 'your_gemini_api_key_here (Placeholder)' : config.geminiApiKey.substring(0, 8) + '...') : 'NOT SET'}`);
  console.log(` - ALLOWED_ORIGINS: ${process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000'}`);
  console.log('\n----------------------------------------------------\n');

  // 1. Test Local/In-Memory MongoDB Connection
  console.log('🔄 [1/2] Testing Local MongoDB Connection...');
  try {
    const conn = await connectDatabase();
    const status = getDatabaseStatus();

    console.log('✅ SUCCESS: Connected to MongoDB!');
    console.log(`   - Connected Host: ${status.host || '127.0.0.1'}`);
    console.log(`   - Database Name:  ${status.name || 'medtwin'}`);
    console.log(`   - Mode:           ${status.isInMemory ? '⚡ In-Memory MongoDB (Zero-Setup Local Dev Mode)' : '🐘 Local MongoDB Server (Port 27017)'}`);

    await disconnectDatabase();
    console.log('   - Disconnected cleanly.');
  } catch (err: any) {
    console.error('❌ FAIL: Failed to connect to MongoDB!');
    console.error(`   Error message: ${err.message}`);
  }

  console.log('\n----------------------------------------------------\n');

  // 2. Test Gemini API Key
  console.log('🔄 [2/2] Testing Google Gemini API Key...');
  if (!config.geminiApiKey || config.geminiApiKey === 'your_gemini_api_key_here') {
    console.warn('⚠️ WARNING: GEMINI_API_KEY is not set or using placeholder.');
    console.warn('   AI Drug Safety Analysis & Document OCR features will be disabled until set.');
  } else {
    try {
      const aiClient = new GoogleGenAI({ apiKey: config.geminiApiKey });
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Respond with the single word: "READY"',
      });
      console.log('✅ SUCCESS: Google Gemini API is working!');
      console.log(`   - AI Model Response: ${response.text?.trim()}`);
    } catch (err: any) {
      console.error('❌ FAIL: Gemini API Key validation failed!');
      console.error(`   Error message: ${err.message}`);
    }
  }

  console.log('\n====================================================');
  console.log('             Diagnostic Completed                   ');
  console.log('====================================================');
}

testConfiguration().catch(console.error);
