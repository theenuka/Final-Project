import axios, { InternalAxiosRequestConfig } from "axios";
import { getAccessTokenFromProvider } from "./asgardeo-token-bridge";
import { resolveApiBaseUrl } from "./runtime-config";

// Extend axios config to include metadata
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: { retryCount: number };
}

// Create axios instance with consistent configuration
const axiosInstance = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Ensure cookies are sent with requests
  timeout: 30000, // 30 second timeout
});

// Request interceptor to add Authorization header with Asgardeo access token
axiosInstance.interceptors.request.use(async (config: CustomAxiosRequestConfig) => {
  const token = await getAccessTokenFromProvider();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.metadata = { retryCount: 0 };

  return config;
});

// Response interceptor to handle common errors and retries
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config } = error;

    // Handle 401 errors by clearing session
    if (error.response?.status === 401) {
      // Let components react to unauthorized responses (e.g., show toast or redirect to login)
    }

    // Handle rate limiting (429) with retry logic
    if (error.response?.status === 429 && config) {
      const customConfig = config as CustomAxiosRequestConfig;
      if (customConfig.metadata && customConfig.metadata.retryCount < 3) {
        const customConfig = config as CustomAxiosRequestConfig;
        if (customConfig.metadata) {
          customConfig.metadata.retryCount += 1;

          // Exponential backoff: wait 1s, 2s, 4s
          const delay =
            Math.pow(2, customConfig.metadata.retryCount - 1) * 1000;

          await new Promise((resolve) => setTimeout(resolve, delay));

          return axiosInstance(config);
        }
      }
    }

    // Handle network errors with retry
    if (!error.response && config) {
      const customConfig = config as CustomAxiosRequestConfig;
      if (customConfig.metadata && customConfig.metadata.retryCount < 2) {
        const customConfig = config as CustomAxiosRequestConfig;
        if (customConfig.metadata) {
          customConfig.metadata.retryCount += 1;

          // Wait 2 seconds before retry
          await new Promise((resolve) => setTimeout(resolve, 2000));

          return axiosInstance(config);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
