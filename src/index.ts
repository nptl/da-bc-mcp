#!/usr/bin/env node

import { createServer } from 'http';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { MCPServer } from './server.js';

// Store active SSE transports by session ID
const transports: Record<string, SSEServerTransport> = {};

async function main() {
  try {
    const mcpServer = new MCPServer();
    await mcpServer.start();

    // Create HTTP server for both MCP SSE and health checks
    const port = process.env.PORT || 8080;
    const httpServer = createServer(async (req, res) => {
      // CORS headers for cross-origin requests
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      // Health check endpoints
      if (req.url === '/' || req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'healthy',
          service: 'da-bc-mcp-server',
          environment: process.env.NODE_ENV || 'development',
          timestamp: new Date().toISOString(),
          protocol: 'MCP over SSE',
          endpoints: {
            health: '/health',
            sse: '/sse',
            message: '/message'
          }
        }));
        return;
      }

      // MCP SSE connection endpoint (GET)
      if ((req.url === '/sse' || req.url === '/mcp') && req.method === 'GET') {
        console.log('[SSE] New MCP connection request');

        const transport = new SSEServerTransport('/message', res);
        transports[transport.sessionId] = transport;

        // Clean up transport when connection closes
        res.on('close', () => {
          console.log(`[SSE] Client disconnected: ${transport.sessionId}`);
          delete transports[transport.sessionId];
        });

        await mcpServer.getServer().connect(transport);

        console.log(`[SSE] MCP client connected: ${transport.sessionId}`);
        return;
      }

      // MCP message endpoint (POST)
      if (req.url?.startsWith('/message') && req.method === 'POST') {
        // Extract session ID from query parameters
        const url = new URL(req.url, `http://${req.headers.host}`);
        const sessionId = url.searchParams.get('sessionId');

        if (!sessionId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing sessionId parameter' }));
          return;
        }

        const transport = transports[sessionId];
        if (!transport) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Session not found' }));
          return;
        }

        // Read the request body
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          try {
            const message = JSON.parse(body);
            console.log(`[SSE] Message received for session ${sessionId}:`, message.method);
            await transport.handlePostMessage(req, res, message);
          } catch (error: any) {
            console.error('[SSE] Error handling message:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
          }
        });

        return;
      }

      // 404 for other routes
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    });

    httpServer.listen(port, () => {
      console.log(`[HTTP] Server listening on port ${port}`);
      console.log(`[HTTP] Health endpoint: http://localhost:${port}/health`);
      console.log(`[MCP] SSE endpoint: http://localhost:${port}/sse`);
      console.log(`[MCP] Server running in ${process.env.NODE_ENV || 'development'} mode`);
    });

  } catch (error) {
    console.error('[Main] Fatal error:', error);
    process.exit(1);
  }
}

main();
