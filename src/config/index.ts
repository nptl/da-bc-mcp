import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment-specific .env file
const env = process.env.NODE_ENV || 'beta';
const envFile = env === 'production' ? '.env.production' : '.env.beta';
const envPath = join(__dirname, '..', '..', envFile);

dotenv.config({ path: envPath });

console.log(`[Config] Loading environment: ${env}`);
console.log(`[Config] Using env file: ${envFile}`);

export const config = {
  // Environment
  nodeEnv: process.env.NODE_ENV || 'beta',
  port: parseInt(process.env.PORT || '8080', 10),

  // Auth API
  authBaseUrl: process.env.AUTH_BASE_URL!,
  authTokenEndpoint: process.env.AUTH_TOKEN_ENDPOINT!,

  // Main API
  apiBaseUrl: process.env.API_BASE_URL!,

  // Credentials
  clientId: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
  grantType: process.env.GRANT_TYPE || 'client_credentials',

  // MCP Server Info
  mcpServerName: 'da-bc-mcp-server',
  mcpServerVersion: '1.0.0',
};

// Validate required configuration
const requiredFields = [
  'authBaseUrl',
  'authTokenEndpoint',
  'apiBaseUrl',
  'clientId',
  'clientSecret',
];

for (const field of requiredFields) {
  if (!config[field as keyof typeof config]) {
    throw new Error(`Missing required configuration: ${field}`);
  }
}

console.log(`[Config] Auth URL: ${config.authBaseUrl}`);
console.log(`[Config] API URL: ${config.apiBaseUrl}`);
console.log(`[Config] Client ID: ${config.clientId.substring(0, 8)}...`);
