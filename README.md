# DA BC MCP Server

Model Context Protocol (MCP) server for Damensch BetterCommerce APIs.

## 🎯 Overview

This MCP server exposes BetterCommerce APIs to AI agents, enabling them to:
1. Authenticate and get access tokens
2. Retrieve customer details by email, phone, or name

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

### Running Locally

#### Beta Environment
```bash
# Set environment
export NODE_ENV=beta

# Run the server
npm start
```

#### Production Environment
```bash
# Set environment
export NODE_ENV=production

# Run the server
npm start
```

### Development Mode
```bash
# Run with auto-reload
npm run dev
```

## 🔧 Configuration

The server supports two environments: **beta** and **production**.

Configuration is stored in environment-specific files:
- `.env.beta` - Beta environment settings
- `.env.production` - Production environment settings

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Environment (beta/production) |
| `AUTH_BASE_URL` | Authentication API base URL |
| `API_BASE_URL` | Main API base URL |
| `CLIENT_ID` | OAuth client ID |
| `CLIENT_SECRET` | OAuth client secret |
| `PORT` | Server port (default: 8080) |

## 🛠️ Available Tools

### 1. `get_auth_token`
Get an authentication token for API access.

**Input:** None

**Output:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 35999
}
```

### 2. `get_customer_details`
Retrieve customer information.

**Input:**
```json
{
  "email": "customer@example.com",  // Optional
  "phone": "1234567890",            // Optional
  "username": "johndoe",            // Optional
  "firstname": "John",              // Optional
  "lastname": "Doe"                 // Optional
}
```

*Note: At least one search criterion is required.*

**Output:**
```json
{
  "success": true,
  "customer": {
    "userId": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "mobile": "1234567890",
    "isRegistered": true,
    ...
  }
}
```

## 📦 Project Structure

```
da-bc-mcp-server/
├── src/
│   ├── index.ts           # Entry point
│   ├── server.ts          # MCP server implementation
│   ├── config/            # Configuration management
│   │   └── index.ts
│   ├── clients/           # API clients
│   │   └── api-client.ts
│   └── tools/             # MCP tool definitions
│       ├── get-auth-token.ts
│       ├── get-customer-details.ts
│       └── index.ts
├── dist/                  # Compiled JavaScript
├── .env.beta             # Beta environment config
├── .env.production       # Production environment config
├── Dockerfile            # Container definition
├── package.json
├── tsconfig.json
└── README.md
```

## 🐳 Docker

### Build
```bash
docker build -t da-bc-mcp-server .
```

### Run (Beta)
```bash
docker run -e NODE_ENV=beta da-bc-mcp-server
```

### Run (Production)
```bash
docker run -e NODE_ENV=production da-bc-mcp-server
```

## ☁️ Deployment

### Google Cloud Run

#### Deploy Beta
```bash
gcloud run deploy da-bc-mcp-server-beta \
  --image gcr.io/PROJECT_ID/da-bc-mcp-server:latest \
  --platform managed \
  --region us-central1 \
  --set-env-vars NODE_ENV=beta
```

#### Deploy Production
```bash
gcloud run deploy da-bc-mcp-server-prod \
  --image gcr.io/PROJECT_ID/da-bc-mcp-server:latest \
  --platform managed \
  --region us-central1 \
  --set-env-vars NODE_ENV=production
```

## 🔍 Testing

### Test Authentication
```bash
# The server will automatically test auth when it starts
npm start
```

### Test with MCP Inspector
```bash
npx @modelcontextprotocol/inspector dist/index.js
```

## 🔒 Security

- Credentials are stored in environment-specific `.env` files
- `.env` files are gitignored
- Tokens are automatically cached and refreshed
- All API calls use Bearer token authentication

## 📊 Monitoring

Logs include:
- Environment configuration on startup
- Tool executions
- API request/response details
- Error messages with stack traces

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test in beta environment
4. Create a pull request
5. Deploy to production after approval

## 📝 License

ISC

---

**Last Updated:** October 2024
**Maintained By:** Niraj Patel
