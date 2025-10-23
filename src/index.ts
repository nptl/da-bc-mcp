#!/usr/bin/env node

import { MCPServer } from './server.js';

async function main() {
  try {
    const server = new MCPServer();
    await server.start();
  } catch (error) {
    console.error('[Main] Fatal error:', error);
    process.exit(1);
  }
}

main();
