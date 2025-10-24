#!/usr/bin/env node

import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { MCPServer } from './server.js';

async function main() {
  try {
    const mcpServer = new MCPServer();
    await mcpServer.start();

    // Create Express app
    const app = express();
    app.use(express.json());

    // CORS middleware
    app.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
      }
      next();
    });

    // Health check endpoint
    app.get(['/', '/health'], (req, res) => {
      res.json({
        status: 'healthy',
        service: 'da-bc-mcp-server',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        protocol: 'MCP Streamable HTTP',
        endpoints: {
          health: '/health',
          mcp: '/mcp'
        }
      });
    });

    // MCP Streamable HTTP endpoint
    app.post('/mcp', async (req, res) => {
      console.log('[MCP] New request received');

      try {
        // Create a new transport for each request to prevent request ID collisions
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
          enableJsonResponse: true
        });

        // Clean up transport when connection closes
        res.on('close', () => {
          console.log('[MCP] Request connection closed');
          transport.close();
        });

        // Connect server to transport
        await mcpServer.getServer().connect(transport);

        // Handle the MCP request
        await transport.handleRequest(req, res, req.body);

        console.log('[MCP] Request handled successfully');
      } catch (error: any) {
        console.error('[MCP] Error handling request:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: error.message });
        }
      }
    });

    const port = process.env.PORT || 8080;
    app.listen(port, () => {
      console.log(`[HTTP] Server listening on port ${port}`);
      console.log(`[HTTP] Health endpoint: http://localhost:${port}/health`);
      console.log(`[MCP] Streamable HTTP endpoint: http://localhost:${port}/mcp`);
      console.log(`[MCP] Server running in ${process.env.NODE_ENV || 'development'} mode`);
    });

  } catch (error) {
    console.error('[Main] Fatal error:', error);
    process.exit(1);
  }
}

main();
