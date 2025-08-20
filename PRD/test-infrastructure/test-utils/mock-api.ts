import { vi } from 'vitest';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

// API 基礎 URL
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Mock 響應類型
interface MockResponse {
  status?: number;
  data?: any;
  error?: string;
  delay?: number;
}

// API Mock 建構器
export class ApiMockBuilder {
  private handlers: any[] = [];

  // 通用請求處理器
  private createHandler(
    method: 'get' | 'post' | 'put' | 'delete' | 'patch',
    path: string,
    response: MockResponse
  ) {
    const url = `${API_BASE_URL}${path}`;
    const handler = rest[method](url, async (req, res, ctx) => {
      const { status = 200, data, error, delay = 0 } = response;
      
      // 模擬延遲
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // 錯誤響應
      if (error) {
        return res(
          ctx.status(status >= 400 ? status : 400),
          ctx.json({ error, message: error })
        );
      }

      // 成功響應
      return res(ctx.status(status), ctx.json(data || {}));
    });

    this.handlers.push(handler);
    return this;
  }

  // HTTP 方法
  get(path: string, response: MockResponse) {
    return this.createHandler('get', path, response);
  }

  post(path: string, response: MockResponse) {
    return this.createHandler('post', path, response);
  }

  put(path: string, response: MockResponse) {
    return this.createHandler('put', path, response);
  }

  delete(path: string, response: MockResponse) {
    return this.createHandler('delete', path, response);
  }

  patch(path: string, response: MockResponse) {
    return this.createHandler('patch', path, response);
  }

  // 建立 Mock Server
  build() {
    return setupServer(...this.handlers);
  }
}

// 預設 Mock Handlers
export const defaultHandlers = [
  // 登入
  rest.post(`${API_BASE_URL}/auth/login`, (req, res, ctx) => {
    return res(
      ctx.json({
        token: 'test-token',
        user: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
        },
      })
    );
  }),

  // 登出
  rest.post(`${API_BASE_URL}/auth/logout`, (req, res, ctx) => {
    return res(ctx.json({ success: true }));
  }),

  // 健康檢查
  rest.get(`${API_BASE_URL}/health`, (req, res, ctx) => {
    return res(ctx.json({ status: 'ok' }));
  }),
];

// 創建預設的 Mock Server
export const createMockServer = (customHandlers: any[] = []) => {
  return setupServer(...defaultHandlers, ...customHandlers);
};

// Mock API 客戶端
export class MockApiClient {
  private baseURL: string;
  private headers: Record<string, string>;
  private interceptors: {
    request: ((config: any) => any)[];
    response: ((response: any) => any)[];
  };

  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
    this.headers = {
      'Content-Type': 'application/json',
    };
    this.interceptors = {
      request: [],
      response: [],
    };
  }

  setHeader(key: string, value: string) {
    this.headers[key] = value;
    return this;
  }

  setToken(token: string) {
    this.headers['Authorization'] = `Bearer ${token}`;
    return this;
  }

  async request(method: string, path: string, data?: any) {
    let config = {
      method,
      url: `${this.baseURL}${path}`,
      headers: { ...this.headers },
      body: data ? JSON.stringify(data) : undefined,
    };

    // 執行請求攔截器
    for (const interceptor of this.interceptors.request) {
      config = await interceptor(config);
    }

    // 模擬請求
    const response = await fetch(config.url, {
      method: config.method,
      headers: config.headers,
      body: config.body,
    });

    let result = {
      data: await response.json(),
      status: response.status,
      headers: response.headers,
    };

    // 執行響應攔截器
    for (const interceptor of this.interceptors.response) {
      result = await interceptor(result);
    }

    if (!response.ok) {
      throw new Error(result.data.error || 'Request failed');
    }

    return result.data;
  }

  get(path: string) {
    return this.request('GET', path);
  }

  post(path: string, data?: any) {
    return this.request('POST', path, data);
  }

  put(path: string, data?: any) {
    return this.request('PUT', path, data);
  }

  delete(path: string) {
    return this.request('DELETE', path);
  }

  patch(path: string, data?: any) {
    return this.request('PATCH', path, data);
  }

  // 添加請求攔截器
  addRequestInterceptor(interceptor: (config: any) => any) {
    this.interceptors.request.push(interceptor);
    return this;
  }

  // 添加響應攔截器
  addResponseInterceptor(interceptor: (response: any) => any) {
    this.interceptors.response.push(interceptor);
    return this;
  }
}

// 創建 Mock API 實例
export const createMockApiClient = (token?: string) => {
  const client = new MockApiClient();
  if (token) {
    client.setToken(token);
  }
  return client;
};

// Mock 延遲函數
export const mockDelay = (ms: number) => 
  new Promise(resolve => setTimeout(resolve, ms));

// Mock 錯誤響應
export const mockError = (message: string, status = 400) => ({
  status,
  error: message,
});

// Mock 成功響應
export const mockSuccess = (data: any, status = 200) => ({
  status,
  data,
});

// Mock 分頁響應
export const mockPagination = (
  items: any[],
  page = 1,
  limit = 20,
  total?: number
) => ({
  data: items.slice((page - 1) * limit, page * limit),
  pagination: {
    page,
    limit,
    total: total || items.length,
    totalPages: Math.ceil((total || items.length) / limit),
  },
});