import { getAuthTokenTool } from './get-auth-token.js';
import { getCustomerDetailsTool } from './get-customer-details.js';
import { getCustomerOrdersTool } from './get-customer-orders.js';
import { getOrderDetailsTool } from './get-order-details.js';

export const tools = [
  getAuthTokenTool,
  getCustomerDetailsTool,
  getCustomerOrdersTool,
  getOrderDetailsTool,
];

export async function executeTool(name: string, args: any) {
  const tool = tools.find((t) => t.name === name);

  if (!tool) {
    throw new Error(`Tool "${name}" not found`);
  }

  return await tool.execute(args);
}
