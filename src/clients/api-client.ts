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
}

export const apiClient = new BetterCommerceClient();
