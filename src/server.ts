import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { config } from './config/index.js';
import { tools, executeTool } from './tools/index.js';

export class MCPServer {
  private server: Server;

  constructor() {
    console.log(`[MCP Server] Initializing ${config.mcpServerName} v${config.mcpServerVersion}`);
    console.log(`[MCP Server] Environment: ${config.nodeEnv}`);

    this.server = new Server(
      {
        name: config.mcpServerName,
        version: config.mcpServerVersion,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  getServer() {
    return this.server;
  }

  private setupHandlers() {
    // Handler: List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.log('[MCP Server] Listing available tools');

      return {
        tools: tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      };
    });

    // Handler: Execute tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      console.log(`[MCP Server] Tool called: ${name}`);
      console.log(`[MCP Server] Arguments:`, JSON.stringify(args, null, 2));

      try {
        const result = await executeTool(name, args || {});

        console.log(`[MCP Server] Tool "${name}" completed successfully`);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error(`[MCP Server] Tool "${name}" failed:`, error.message);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: error.message || 'Tool execution failed',
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.log('[MCP Server] Server running on stdio');
    console.log('[MCP Server] Available tools:');
    tools.forEach((tool) => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
  }
}
