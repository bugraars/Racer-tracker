import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Development: localhost (Android emulator için 10.0.2.2, iOS simulator için localhost)
// Production: Gerçek server IP/domain
// NOT: Aynı Wi-Fi ağında olduğunuzdan emin olun
const DEV_API_URL = __DEV__ 
  ? 'http://192.168.1.109:3000/api'  // Mac'in local IP'si
  : 'https://your-production-server.com/api';

// API Base URL - .env veya config'den alınabilir
export const API_BASE_URL = DEV_API_URL;

// Error callback type
type ErrorCallback = (error: {
  traceId?: string;
  message: string;
  statusCode?: number;
  details?: string;
}) => void;

// Global error handler
let globalErrorHandler: ErrorCallback | null = null;

export const setGlobalErrorHandler = (handler: ErrorCallback) => {
  globalErrorHandler = handler;
};

// Axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token storage key
const TOKEN_KEY = '@auth_token';
const USER_KEY = '@user_data';

// Request interceptor - Her istekte token ekle
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Token okuma hatası:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Hata yönetimi
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    // TraceID'yi response header'dan al
    const traceId = error.response?.headers?.['x-trace-id'] as string | undefined;
    const statusCode = error.response?.status;
    const serverMessage = error.response?.data?.message;
    
    let errorMessage = 'Bir hata oluştu';
    
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
    } else if (error.code === 'ERR_NETWORK') {
      errorMessage = 'Ağ bağlantısı kurulamadı. İnternet bağlantınızı kontrol edin.';
    } else if (serverMessage) {
      errorMessage = serverMessage;
    } else if (statusCode === 401) {
      errorMessage = 'Oturum süresi doldu. Lütfen tekrar giriş yapın.';
    } else if (statusCode === 403) {
      errorMessage = 'Bu işlem için yetkiniz bulunmuyor.';
    } else if (statusCode === 404) {
      errorMessage = 'İstenen kaynak bulunamadı.';
    } else if (statusCode && statusCode >= 500) {
      errorMessage = 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
    }
    
    // Global error handler'a bildir
    if (globalErrorHandler && statusCode !== 401) {
      globalErrorHandler({
        traceId,
        message: errorMessage,
        statusCode,
        details: error.response?.data?.details || error.message,
      });
    }
    
    // 401 Unauthorized - Token geçersiz
    if (statusCode === 401) {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
      // Navigation reset yapılabilir
    }
    
    // Error objesine traceId ekle
    (error as any).traceId = traceId;
    
    return Promise.reject(error);
  }
);

// Token yönetimi helper fonksiyonları
export const tokenService = {
  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem(TOKEN_KEY);
  },

  async setToken(token: string): Promise<void> {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  },

  async removeToken(): Promise<void> {
    await AsyncStorage.removeItem(TOKEN_KEY);
  },

  async getUser(): Promise<any | null> {
    const userData = await AsyncStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  },

  async setUser(user: any): Promise<void> {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  async removeUser(): Promise<void> {
    await AsyncStorage.removeItem(USER_KEY);
  },

  async clearAuth(): Promise<void> {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  }
};

export default api;
