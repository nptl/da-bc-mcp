#!/usr/bin/env node

import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { MCPServer } from './server.js';

// Store active SSE transports by session ID (for backward compatibility)
const sseTransports: Record<string, SSEServerTransport> = {};

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
        protocol: 'MCP Streamable HTTP + SSE (backward compatible)',
        endpoints: {
          health: '/health',
          mcp: '/mcp (Streamable HTTP - recommended)',
          sse: '/sse (legacy SSE for OpenAI compatibility)'
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

    // SSE endpoint (legacy, for backward compatibility with older clients like OpenAI)
    app.get('/sse', async (req, res) => {
      console.log('[SSE] New connection request (legacy transport)');

      try {
        const transport = new SSEServerTransport('/message', res);
        sseTransports[transport.sessionId] = transport;

        // Clean up transport when connection closes
        res.on('close', () => {
          console.log(`[SSE] Client disconnected: ${transport.sessionId}`);
          delete sseTransports[transport.sessionId];
        });

        await mcpServer.getServer().connect(transport);

        console.log(`[SSE] Client connected: ${transport.sessionId}`);
      } catch (error: any) {
        console.error('[SSE] Error establishing connection:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: error.message });
        }
      }
    });

    // SSE message endpoint (legacy)
    app.post('/message', async (req, res) => {
      const sessionId = req.query.sessionId as string;

      if (!sessionId) {
        res.status(400).json({ error: 'Missing sessionId parameter' });
        return;
      }

      const transport = sseTransports[sessionId];
      if (!transport) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      console.log(`[SSE] Message received for session ${sessionId}`);

      try {
        await transport.handlePostMessage(req, res, req.body);
      } catch (error: any) {
        console.error('[SSE] Error handling message:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: error.message });
        }
      }
    });

    const port = process.env.PORT || 8080;
    app.listen(port, () => {
      console.log(`[HTTP] Server listening on port ${port}`);
      console.log(`[HTTP] Health endpoint: http://localhost:${port}/health`);
      console.log(`[MCP] Streamable HTTP endpoint: http://localhost:${port}/mcp (recommended)`);
      console.log(`[MCP] SSE endpoint: http://localhost:${port}/sse (legacy, for OpenAI compatibility)`);
      console.log(`[MCP] Server running in ${process.env.NODE_ENV || 'development'} mode`);
    });

  } catch (error) {
    console.error('[Main] Fatal error:', error);
    process.exit(1);
  }
}

main();
