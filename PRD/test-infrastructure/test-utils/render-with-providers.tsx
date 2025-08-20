import React, { ReactElement, ReactNode } from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// 創建測試用的 QueryClient
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });

// 創建測試用的 Redux Store
export const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      // 根據需要添加 reducers
      test: (state = initialState) => state,
    },
    preloadedState: initialState,
  });
};

interface AllTheProvidersProps {
  children: ReactNode;
  initialState?: any;
  queryClient?: QueryClient;
}

// 包含所有必要的 Providers
const AllTheProviders: React.FC<AllTheProvidersProps> = ({
  children,
  initialState = {},
  queryClient = createTestQueryClient(),
}) => {
  const store = createTestStore(initialState);

  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider>
          <BrowserRouter>{children}</BrowserRouter>
        </ChakraProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
};

// 自定義 render 函數
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: any;
  queryClient?: QueryClient;
}

export const renderWithProviders = (
  ui: ReactElement,
  options?: CustomRenderOptions
) => {
  const { initialState, queryClient, ...renderOptions } = options || {};

  return rtlRender(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders initialState={initialState} queryClient={queryClient}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  });
};

// 只包含 Chakra UI 的簡單 render
export const renderWithChakra = (ui: ReactElement) => {
  return rtlRender(ui, {
    wrapper: ({ children }) => <ChakraProvider>{children}</ChakraProvider>,
  });
};

// 只包含 React Query 的 render
export const renderWithQuery = (
  ui: ReactElement,
  queryClient = createTestQueryClient()
) => {
  return rtlRender(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { renderWithProviders as render };