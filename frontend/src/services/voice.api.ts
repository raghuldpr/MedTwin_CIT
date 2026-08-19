import { post } from './api';

export interface VoiceCommandResult {
  action: 'NAVIGATE' | 'LOG_VITAL' | 'SUMMARIZE' | 'UNKNOWN';
  target?: string;
  responseMessage: string;
  data?: Record<string, unknown>;
}

export const voiceApi = {
  processCommand: (command: string) =>
    post<VoiceCommandResult>('/api/voice/command', { command }),
};
