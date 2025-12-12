import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import App from './App';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AppContextProvider } from './contexts/AppContext';
import { SearchContextProvider } from './contexts/SearchContext';

// Mock Asgardeo Auth
vi.mock('@asgardeo/auth-react', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuthContext: () => ({
    state: { isAuthenticated: false },
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

// Mock AppContext
vi.mock('./hooks/useAppContext', () => ({
  default: () => ({
    isLoggedIn: false,
    userRoles: [],
    stripePromise: Promise.resolve(null),
  }),
}));

// Mock matchMedia for Radix UI or other components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock global fetch to prevent network errors during tests
global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve([]),
    ok: true,
  })
) as any;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('App', () => {
  it('renders without crashing', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AppContextProvider>
          <SearchContextProvider>
            <App />
          </SearchContextProvider>
        </AppContextProvider>
      </QueryClientProvider>
    );
    expect(document.body).toBeInTheDocument();
  });
});
