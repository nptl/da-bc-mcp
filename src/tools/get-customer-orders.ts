import { z } from 'zod';
import { apiClient } from '../clients/api-client.js';

// Input schema for customer orders lookup
const customerOrdersSchema = z.object({
  userId: z.string().min(1).describe('Customer user ID obtained from get_customer_details'),
  pageNumber: z.number().int().positive().optional().describe('Page number for pagination (default: 1)'),
  pageSize: z.number().int().positive().max(100).optional().describe('Number of orders per page (default: 10, max: 100)'),
  orderStatus: z.string().optional().describe('Filter by order status (e.g., "Delivered", "Cancelled", "Incomplete", "Pending")'),
  dateFrom: z.string().optional().describe('Filter orders from this date (ISO format: YYYY-MM-DD)'),
  dateTo: z.string().optional().describe('Filter orders until this date (ISO format: YYYY-MM-DD)'),
  sortBy: z.string().optional().describe('Sort orders by field (e.g., "orderDate", "total")'),
});

export const getCustomerOrdersTool = {
  name: 'get_customer_orders',
  description: 'Retrieves a paginated list of customer orders from the BetterCommerce API. Returns order summaries including order number, date, status, totals, and basic item information. Supports filtering by order status, date range, and custom sorting. Use the userId obtained from get_customer_details to fetch orders for a specific customer.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      userId: {
        type: 'string',
        description: 'Customer user ID (obtained from get_customer_details)',
      },
      pageNumber: {
        type: 'number',
        description: 'Page number for pagination (default: 1)',
      },
      pageSize: {
        type: 'number',
        description: 'Number of orders per page (default: 10, max: 100). Let the calling agent decide based on their needs.',
      },
      orderStatus: {
        type: 'string',
        description: 'Filter by order status (e.g., "Delivered", "Cancelled", "Incomplete", "Pending")',
      },
      dateFrom: {
        type: 'string',
        description: 'Filter orders from this date (ISO format: YYYY-MM-DD)',
      },
      dateTo: {
        type: 'string',
        description: 'Filter orders until this date (ISO format: YYYY-MM-DD)',
      },
      sortBy: {
        type: 'string',
        description: 'Sort orders by field (e.g., "orderDate", "total")',
      },
    },
    required: ['userId'],
  },

  async execute(args: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('[Tool: get_customer_orders] Executing with args:', args);

      // Validate input
      const validated = customerOrdersSchema.parse(args);

      // Fetch customer orders
      const result = await apiClient.getCustomerOrders({
        userId: validated.userId,
        pageNumber: validated.pageNumber,
        pageSize: validated.pageSize,
        orderStatus: validated.orderStatus,
        dateFrom: validated.dateFrom,
        dateTo: validated.dateTo,
        sortBy: validated.sortBy,
      });

      // Return formatted order data
      return {
        success: true,
        data: {
          pagination: {
            currentPage: result.pageNumber,
            pageSize: result.pageSize,
            totalRecords: result.totalRecords,
            totalPages: result.totalPages,
          },
          orders: result.orders,
          summary: {
            ordersOnThisPage: result.orders.length,
            totalOrdersFound: result.totalRecords,
          },
        },
      };
    } catch (error: any) {
      console.error('[Tool: get_customer_orders] Error:', error.message);

      // Handle validation errors
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: `Invalid input: ${error.errors.map(e => e.message).join(', ')}`,
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to fetch customer orders',
      };
    }
  },
};
