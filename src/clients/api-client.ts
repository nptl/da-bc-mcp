import axios, { AxiosInstance } from 'axios';
import { config } from '../config/index.js';

interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface CustomerResult {
  userId: string;
  username: string | null;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  telephone: string;
  gender: string | null;
  birthDate: string | null;
  postCode: string | null;
  newsLetterSubscribed: boolean;
  isRegistered: boolean;
  [key: string]: any;
}

interface CustomerDetailsResponse {
  statusCode: number;
  status: string;
  success: boolean;
  message: string | null;
  result: CustomerResult[];
}

interface OrderSummary {
  id: string;
  orderNo: string;
  orderDate: string;
  status: string;
  subTotal: {
    raw: number;
    formatted: string;
  };
  total: {
    raw: number;
    formatted: string;
  };
  itemsCount: number;
  items: {
    name: string;
    sku: string;
    qty: number;
  }[];
}

interface CustomerOrdersResponse {
  statusCode: number;
  status: string;
  success: boolean;
  message: string | null;
  result: {
    pageNumber: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
    orders: any[];
  };
}

interface OrderDetailsResponse {
  statusCode: number;
  status: string;
  success: boolean;
  message: string | null;
  result: any;
}

class BetterCommerceClient {
  private authClient: AxiosInstance;
  private apiClient: AxiosInstance;
  private cachedToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor() {
    // Client for authentication
    this.authClient = axios.create({
      baseURL: config.authBaseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'text/plain',
      },
    });

    // Client for API calls
    this.apiClient = axios.create({
      baseURL: config.apiBaseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for API client
    this.apiClient.interceptors.request.use(
      async (config) => {
        // Ensure we have a valid token
        const token = await this.getValidToken();
        config.headers.Authorization = `Bearer ${token}`;
        return config;
      },
      (error) => {
        console.error('[API Client] Request error:', error.message);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[API Client] Response error:', error.response?.data || error.message);
        throw new Error(
          error.response?.data?.message || error.message || 'API request failed'
        );
      }
    );
  }

  /**
   * Get a valid access token (cached or new)
   */
  private async getValidToken(): Promise<string> {
    const now = Date.now();

    // Return cached token if still valid (with 5 minute buffer)
    if (this.cachedToken && this.tokenExpiry && now < this.tokenExpiry - 300000) {
      return this.cachedToken;
    }

    // Get new token
    console.log('[API Client] Fetching new access token...');
    const token = await this.getAuthToken();
    return token;
  }

  /**
   * Tool 1: Get Authentication Token
   */
  async getAuthToken(): Promise<string> {
    try {
      const requestBody = `client_id=${encodeURIComponent(config.clientId)}&client_secret=${encodeURIComponent(config.clientSecret)}&grant_type=${config.grantType}`;

      console.log('[Auth] Requesting token from:', config.authBaseUrl + config.authTokenEndpoint);

      const response = await this.authClient.post<AuthTokenResponse>(
        config.authTokenEndpoint,
        requestBody
      );

      const { access_token, expires_in } = response.data;

      // Cache the token
      this.cachedToken = access_token;
      this.tokenExpiry = Date.now() + (expires_in * 1000);

      console.log('[Auth] Token received, expires in:', expires_in, 'seconds');

      return access_token;
    } catch (error: any) {
      console.error('[Auth] Failed to get token:', error.response?.data || error.message);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Tool 2: Get Customer Details
   */
  async getCustomerDetails(params: {
    email?: string;
    phone?: string;
    username?: string;
    firstname?: string;
    lastname?: string;
  }): Promise<CustomerResult | null> {
    try {
      // Build form data
      const formData = new URLSearchParams();
      formData.append('email', params.email || '');
      formData.append('phone', params.phone || '');
      formData.append('username', params.username || '');
      formData.append('firstname', params.firstname || '');
      formData.append('lastname', params.lastname || '');

      console.log('[API] Fetching customer details:', params);

      const response = await this.apiClient.post<CustomerDetailsResponse>(
        '/api/v2/commerce/customer',
        formData.toString()
      );

      const { success, result, statusCode } = response.data;

      if (!success || statusCode !== 200) {
        throw new Error('Customer lookup failed');
      }

      if (result && result.length > 0) {
        console.log('[API] Customer found:', result[0].userId);
        return result[0];
      }

      console.log('[API] No customer found with provided criteria');
      return null;
    } catch (error: any) {
      console.error('[API] Failed to get customer details:', error.response?.data || error.message);
      throw new Error(`Failed to fetch customer details: ${error.message}`);
    }
  }

  /**
   * Tool 3: Get Customer Orders
   */
  async getCustomerOrders(params: {
    userId: string;
    pageNumber?: number;
    pageSize?: number;
    orderStatus?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
  }): Promise<{
    pageNumber: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
    orders: OrderSummary[];
  }> {
    try {
      const {
        userId,
        pageNumber = 1,
        pageSize = 10,
        orderStatus,
        dateFrom,
        dateTo,
        sortBy
      } = params;

      // Build query parameters
      const queryParams = new URLSearchParams({
        pageNumber: pageNumber.toString(),
        pageSize: pageSize.toString(),
      });

      if (orderStatus) queryParams.append('orderStatus', orderStatus);
      if (dateFrom) queryParams.append('dateFrom', dateFrom);
      if (dateTo) queryParams.append('dateTo', dateTo);
      if (sortBy) queryParams.append('sortBy', sortBy);

      const endpoint = `/api/v2/commerce/customer/${userId}/orders?${queryParams.toString()}`;
      console.log('[API] Fetching customer orders:', endpoint);

      const response = await this.apiClient.get<CustomerOrdersResponse>(endpoint);

      const { success, result, statusCode } = response.data;

      if (!success || statusCode !== 200) {
        throw new Error('Failed to fetch customer orders');
      }

      // Log the result structure for debugging
      console.log('[API] Customer orders result structure:', JSON.stringify(result, null, 2));

      // Handle case where result might be an array directly or have different structure
      let ordersList: any[] = [];
      let pagination = {
        pageNumber: 1,
        pageSize: 10,
        totalRecords: 0,
        totalPages: 1,
      };

      // Check if result is an array directly
      if (Array.isArray(result)) {
        ordersList = result;
        pagination.totalRecords = result.length;
      }
      // Check if result has orders property
      else if (result && result.orders) {
        ordersList = result.orders;
        pagination = {
          pageNumber: result.pageNumber || 1,
          pageSize: result.pageSize || 10,
          totalRecords: result.totalRecords || ordersList.length,
          totalPages: result.totalPages || 1,
        };
      }
      // Check if result has different property names
      else if (result) {
        console.log('[API] Unexpected result structure, returning raw result');
        // Try to find an array property in result
        const keys = Object.keys(result);
        for (const key of keys) {
          if (Array.isArray((result as any)[key])) {
            ordersList = (result as any)[key];
            break;
          }
        }
      }

      // Extract relevant order information
      const orders: OrderSummary[] = ordersList.map((order: any) => ({
        id: order.id,
        orderNo: order.orderNo,
        orderDate: order.orderDate,
        status: order.status,
        subTotal: {
          raw: order.subTotal?.raw || 0,
          formatted: order.subTotal?.formatted || '',
        },
        total: {
          raw: order.total?.raw || 0,
          formatted: order.total?.formatted || '',
        },
        itemsCount: order.items?.length || 0,
        items: (order.items || []).map((item: any) => ({
          name: item.name,
          sku: item.sku,
          qty: item.qty,
        })),
      }));

      console.log(`[API] Found ${orders.length} orders (page ${pagination.pageNumber} of ${pagination.totalPages})`);

      return {
        pageNumber: pagination.pageNumber,
        pageSize: pagination.pageSize,
        totalRecords: pagination.totalRecords,
        totalPages: pagination.totalPages,
        orders,
      };
    } catch (error: any) {
      console.error('[API] Failed to get customer orders:', error.response?.data || error.message);
      throw new Error(`Failed to fetch customer orders: ${error.message}`);
    }
  }

  /**
   * Tool 4: Get Order Details
   */
  async getOrderDetails(orderId: string, detailLevel: 'summary' | 'full' = 'summary'): Promise<any> {
    try {
      const endpoint = `/api/v2/commerce/order/${orderId}`;
      console.log('[API] Fetching order details:', endpoint, 'Detail level:', detailLevel);

      const response = await this.apiClient.get<OrderDetailsResponse>(endpoint);

      const { success, result, statusCode } = response.data;

      if (!success || statusCode !== 200) {
        throw new Error('Failed to fetch order details');
      }

      // For full detail, return the complete order
      if (detailLevel === 'full') {
        console.log('[API] Returning full order details');
        return result;
      }

      // For summary, extract key information
      const order = result;
      const summary = {
        orderInfo: {
          id: order.id,
          orderNo: order.orderNo,
          orderDate: order.orderDate,
          status: order.status,
          currency: order.currency,
        },
        customer: {
          userId: order.userId,
          email: order.customerEmail,
          firstName: order.customerFirstName,
          lastName: order.customerLastName,
          phone: order.customerPhoneNo,
        },
        pricing: {
          subTotal: {
            raw: order.subTotal?.raw || 0,
            formatted: order.subTotal?.formatted || '',
          },
          discount: {
            raw: order.discount?.raw || 0,
            formatted: order.discount?.formatted || '',
          },
          shippingCharge: {
            raw: order.shippingCharge?.raw || 0,
            formatted: order.shippingCharge?.formatted || '',
          },
          total: {
            raw: order.total?.raw || 0,
            formatted: order.total?.formatted || '',
          },
        },
        items: (order.items || []).map((item: any) => ({
          name: item.name,
          sku: item.sku,
          qty: item.qty,
          price: {
            raw: item.price?.raw || 0,
            formatted: item.price?.formatted || '',
          },
          total: {
            raw: item.total?.raw || 0,
            formatted: item.total?.formatted || '',
          },
          image: item.image,
        })),
        shippingAddress: order.shippingAddress ? {
          firstName: order.shippingAddress.firstName,
          lastName: order.shippingAddress.lastName,
          address1: order.shippingAddress.address1,
          address2: order.shippingAddress.address2,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          postCode: order.shippingAddress.postCode,
          country: order.shippingAddress.country,
          phoneNo: order.shippingAddress.phoneNo,
        } : null,
        billingAddress: order.billingAddress ? {
          firstName: order.billingAddress.firstName,
          lastName: order.billingAddress.lastName,
          address1: order.billingAddress.address1,
          address2: order.billingAddress.address2,
          city: order.billingAddress.city,
          state: order.billingAddress.state,
          postCode: order.billingAddress.postCode,
          country: order.billingAddress.country,
          phoneNo: order.billingAddress.phoneNo,
        } : null,
        tracking: (order.deliveryPlans || []).map((plan: any) => ({
          carrier: plan.shippingMethod,
          trackingNumber: plan.trackingNumber,
          status: plan.status,
          estimatedDelivery: plan.estimatedDelivery,
        })),
        payment: order.payments && order.payments.length > 0 ? {
          method: order.payments[0].paymentMethod,
          status: order.payments[0].status,
          amount: {
            raw: order.payments[0].amount?.raw || 0,
            formatted: order.payments[0].amount?.formatted || '',
          },
        } : null,
      };

      console.log('[API] Returning summarized order details');
      return summary;
    } catch (error: any) {
      console.error('[API] Failed to get order details:', error.response?.data || error.message);
      throw new Error(`Failed to fetch order details: ${error.message}`);
    }
  }
}

export const apiClient = new BetterCommerceClient();
