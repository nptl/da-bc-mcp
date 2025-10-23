import { z } from 'zod';
import { apiClient } from '../clients/api-client.js';

export const getAuthTokenTool = {
  name: 'get_auth_token',
  description: 'Retrieves an authentication token for the BetterCommerce API. This token is required for all subsequent API calls. The token is automatically cached and reused until it expires.',
  inputSchema: {
    type: 'object' as const,
    properties: {},
    required: [],
  },

  async execute(): Promise<{ success: boolean; token?: string; expiresIn?: number; error?: string }> {
    try {
      console.log('[Tool: get_auth_token] Executing...');

      const token = await apiClient.getAuthToken();

      return {
        success: true,
        token: token,
        expiresIn: 35999, // ~10 hours
      };
    } catch (error: any) {
      console.error('[Tool: get_auth_token] Error:', error.message);
      return {
        success: false,
        error: error.message || 'Failed to get authentication token',
      };
    }
  },
};
