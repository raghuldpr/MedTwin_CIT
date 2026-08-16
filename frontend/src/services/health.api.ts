/** Health check API */
import { get } from './api';

export const healthApi = {
  check: () => get<{ status?: string; uptime?: number }>('/api/health'),
};
