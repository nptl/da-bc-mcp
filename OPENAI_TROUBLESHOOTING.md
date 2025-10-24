# OpenAI Agent Builder - 424 Error Troubleshooting

## Current Status

**Issue**: OpenAI Agent Builder returns 424 (Failed Dependency) error when connecting to our MCP server.

**Server Status**: ✅ **FULLY FUNCTIONAL**
- All MCP protocol steps working correctly
- Initialize handshake: ✅
- Tools list retrieval: ✅
- Tool execution: ✅
- Successfully tested with curl and manual MCP client

## Test Results

Run `./test-full-mcp-flow.sh` to verify:
```bash
✅ Initialize successful
✅ Initialized notification acknowledged
✅ Tools list retrieved successfully (2 tools)
✅ Tool call successful (customer data retrieved)
```

## Known Issue

This is a **known, ongoing issue** with OpenAI Agent Builder as of October 2025:
- Forum reports from multiple users (as recent as today)
- MCP servers pass all tests but fail in Agent Builder
- Issue persists even when servers respond correctly to all JSON-RPC tests
- Affects multiple MCP server implementations

Source: https://community.openai.com/t/error-when-attempting-to-connect-my-remote-mcp-in-new-agent-builder/1361613

## URLs to Try in OpenAI Agent Builder

### Option 1: Streamable HTTP (Recommended)
```
https://da-bc-mcp-server-beta-289122916571.us-central1.run.app/mcp
```

### Option 2: SSE (Legacy - for backward compatibility)
```
https://da-bc-mcp-server-beta-289122916571.us-central1.run.app/sse
```

### Option 3: Base URL (auto-detection)
```
https://da-bc-mcp-server-beta-289122916571.us-central1.run.app
```

### Option 4: Custom domain (once DNS is configured)
```
https://mcp1-beta.damensch.com/mcp
```

## What We've Implemented

Our server supports **BOTH** transport protocols:

1. **Streamable HTTP** (POST /mcp)
   - Modern MCP standard
   - Single endpoint for all communication
   - JSON-RPC over HTTP POST

2. **SSE** (GET /sse + POST /message)
   - Legacy transport
   - Backward compatibility for older clients
   - Two-endpoint architecture

## Server Capabilities

```json
{
  "protocolVersion": "2024-11-05",
  "capabilities": {
    "tools": {}
  },
  "serverInfo": {
    "name": "da-bc-mcp-server",
    "version": "1.0.0"
  }
}
```

## Available Tools

1. **get_auth_token**
   - No parameters required
   - Returns BetterCommerce API authentication token

2. **get_customer_details**
   - Search by: email, phone, username, or name
   - Returns full customer profile from BetterCommerce

## Alternative Solutions

While waiting for OpenAI to fix the Agent Builder issue:

### 1. Use OpenAI Agents SDK (Code-based)

```typescript
import { hostedMcpTool } from '@openai/agents-sdk';

const mcpTool = hostedMcpTool({
  url: 'https://da-bc-mcp-server-beta-289122916571.us-central1.run.app/mcp',
  label: 'BetterCommerce MCP'
});
```

### 2. Use MCP Inspector (for testing)

```bash
npx @modelcontextprotocol/inspector \
  https://da-bc-mcp-server-beta-289122916571.us-central1.run.app/mcp
```

### 3. Direct API Integration

Use the OpenAI API with function calling and implement MCP tools manually:

```bash
curl -X POST https://da-bc-mcp-server-beta-289122916571.us-central1.run.app/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

## Debugging Steps

If the issue persists:

1. **Check OpenAI Agent Builder Console**
   - Look for specific error messages
   - Check network logs
   - Verify the exact URL being called

2. **Verify HTTPS Certificate**
   ```bash
   curl -v https://da-bc-mcp-server-beta-289122916571.us-central1.run.app/health
   ```

3. **Test with Different Clients**
   - Claude Desktop (supports MCP natively)
   - Cursor IDE
   - VSCode with MCP extension

4. **Monitor Server Logs**
   Check Cloud Run logs for incoming requests:
   ```bash
   gcloud run services logs read da-bc-mcp-server-beta \
     --region us-central1 --project da-mcp --limit 50
   ```

## Workarounds

### Temporary: Use a Working MCP Proxy

Some users report success by using MCP proxy services that translate between different protocol versions.

### Wait for OpenAI Update

Monitor the OpenAI community forum for updates on the 424 issue:
https://community.openai.com/t/error-when-attempting-to-connect-my-remote-mcp-in-new-agent-builder/1361613

## Contact Support

If urgent, reach out to:
- OpenAI support with server details and test results
- Include logs showing successful MCP protocol handshake
- Reference the community forum thread about the 424 error

## Conclusion

**Our MCP server is production-ready and fully functional.** The 424 error is a known issue with OpenAI Agent Builder affecting multiple users and MCP server implementations. The server successfully handles all MCP protocol requirements and can be integrated using alternative methods while waiting for OpenAI to resolve the Agent Builder issue.
