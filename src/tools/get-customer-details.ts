import { z } from 'zod';
import { apiClient } from '../clients/api-client.js';

// Input schema for customer lookup
const customerLookupSchema = z.object({
  email: z.string().email().optional().describe('Customer email address'),
  phone: z.string().optional().describe('Customer phone number'),
  username: z.string().optional().describe('Customer username'),
  firstname: z.string().optional().describe('Customer first name'),
  lastname: z.string().optional().describe('Customer last name'),
}).refine(
  (data) => data.email || data.phone || data.username || (data.firstname && data.lastname),
  {
    message: 'At least one search criterion must be provided (email, phone, username, or firstname + lastname)',
  }
);

export const getCustomerDetailsTool = {
  name: 'get_customer_details',
  description: 'Retrieves detailed customer information from the BetterCommerce API. You can search by email, phone number, username, or a combination of first name and last name. At least one search criterion must be provided. Returns comprehensive customer profile including userId, contact information, registration status, and preferences.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      email: {
        type: 'string',
        description: 'Customer email address for lookup',
      },
      phone: {
        type: 'string',
        description: 'Customer phone number for lookup',
      },
      username: {
        type: 'string',
        description: 'Customer username for lookup',
      },
      firstname: {
        type: 'string',
        description: 'Customer first name (use with lastname)',
      },
      lastname: {
        type: 'string',
        description: 'Customer last name (use with firstname)',
      },
    },
    required: [],
  },

  async execute(args: any): Promise<{ success: boolean; customer?: any; error?: string }> {
    try {
      console.log('[Tool: get_customer_details] Executing with args:', args);

      // Validate input
      const validated = customerLookupSchema.parse(args);

      // Fetch customer details
      const customer = await apiClient.getCustomerDetails({
        email: validated.email,
        phone: validated.phone,
        username: validated.username,
        firstname: validated.firstname,
        lastname: validated.lastname,
      });

      if (!customer) {
        return {
          success: false,
          error: 'No customer found matching the provided criteria',
        };
      }

      // Return formatted customer data
      return {
        success: true,
        customer: {
          userId: customer.userId,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          mobile: customer.mobile,
          telephone: customer.telephone,
          gender: customer.gender,
          birthDate: customer.birthDate,
          postCode: customer.postCode,
          isRegistered: customer.isRegistered,
          newsLetterSubscribed: customer.newsLetterSubscribed,
          // Include full customer object for detailed analysis
          fullProfile: customer,
        },
      };
    } catch (error: any) {
      console.error('[Tool: get_customer_details] Error:', error.message);

      // Handle validation errors
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: `Invalid input: ${error.errors.map(e => e.message).join(', ')}`,
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to fetch customer details',
      };
    }
  },
};
