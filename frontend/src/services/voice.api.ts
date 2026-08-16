/** Voice Command API Service */
import { post } from './api';

export interface VoiceCommandResult {
  intent: string;
  allowed: boolean;
  message: string;
  targetEndpoint: string | null;
  requiresParameters: boolean;
}

export const voiceApi = {
  sendCommand: (command: string) =>
    post<VoiceCommandResult>('/api/voice/command', { command }),
};
