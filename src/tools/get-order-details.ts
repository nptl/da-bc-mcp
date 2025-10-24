import { z } from 'zod';
import { apiClient } from '../clients/api-client.js';

// Input schema for order details lookup
const orderDetailsSchema = z.object({
  orderId: z.string().min(1).describe('Order ID to retrieve details for'),
  detailLevel: z.enum(['summary', 'full']).optional().default('summary').describe('Level of detail to return: "summary" for key information, "full" for complete order data'),
});

export const getOrderDetailsTool = {
  name: 'get_order_details',
  description: 'Retrieves detailed information about a specific order from the BetterCommerce API. By default, returns a summary with key information including order info, customer details, pricing, items, addresses, tracking, and payment. Use detailLevel="full" to get the complete raw order data with all fields. This tool requires an orderId which can be obtained from get_customer_orders.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      orderId: {
        type: 'string',
        description: 'Order ID to retrieve details for (obtained from get_customer_orders)',
      },
      detailLevel: {
        type: 'string',
        enum: ['summary', 'full'],
        description: 'Level of detail: "summary" (default) for key information, "full" for complete order data',
      },
    },
    required: ['orderId'],
  },

  async execute(args: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('[Tool: get_order_details] Executing with args:', args);

      // Validate input
      const validated = orderDetailsSchema.parse(args);

      // Fetch order details
      const orderDetails = await apiClient.getOrderDetails(
        validated.orderId,
        validated.detailLevel
      );

      // Return formatted order data
      return {
        success: true,
        data: {
          detailLevel: validated.detailLevel,
          order: orderDetails,
        },
      };
    } catch (error: any) {
      console.error('[Tool: get_order_details] Error:', error.message);

      // Handle validation errors
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: `Invalid input: ${error.errors.map(e => e.message).join(', ')}`,
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to fetch order details',
      };
    }
  },
};
