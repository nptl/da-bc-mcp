#!/usr/bin/env node

import { createServer } from 'http';
import { MCPServer } from './server.js';

async function main() {
  try {
    const server = new MCPServer();
    await server.start();

    // Create HTTP server for Cloud Run health checks
    const port = process.env.PORT || 8080;
    const httpServer = createServer((req, res) => {
      if (req.url === '/' || req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'healthy',
          service: 'da-bc-mcp-server',
          environment: process.env.NODE_ENV || 'development',
          timestamp: new Date().toISOString()
        }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    });

    httpServer.listen(port, () => {
      console.log(`[HTTP] Health check server listening on port ${port}`);
      console.log(`[MCP] Server running in ${process.env.NODE_ENV || 'development'} mode`);
    });

  } catch (error) {
    console.error('[Main] Fatal error:', error);
    process.exit(1);
  }
}

main();
