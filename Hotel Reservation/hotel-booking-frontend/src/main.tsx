import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { QueryClient, QueryClientProvider } from "react-query";
import { AppContextProvider } from "./contexts/AppContext.tsx";
import { SearchContextProvider } from "./contexts/SearchContext.tsx";
import { AuthProvider } from "@asgardeo/auth-react";
import { getRuntimeConfig, pickFirst } from "./lib/runtime-config";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
    },
  },
});

const runtimeConfig = getRuntimeConfig();

const rawScopes = pickFirst<string | string[] | undefined>(
  Array.isArray(runtimeConfig?.scope)
    ? (runtimeConfig?.scope as string[])
    : runtimeConfig?.scope,
  import.meta.env.VITE_ASGARDEO_SCOPES,
  "openid profile email"
);

const resolvedScopes = Array.isArray(rawScopes)
  ? rawScopes.filter(Boolean)
  : (rawScopes || "")
      .split(/[ ,]/)
      .map((scope: string) => scope.trim())
      .filter(Boolean);

const authConfig = {
  signInRedirectURL:
    pickFirst(runtimeConfig?.signInRedirectURL, import.meta.env.VITE_ASGARDEO_SIGN_IN_REDIRECT) ||
    window.location.origin,
  signOutRedirectURL:
    pickFirst(runtimeConfig?.signOutRedirectURL, import.meta.env.VITE_ASGARDEO_SIGN_OUT_REDIRECT) ||
    window.location.origin,
  clientID: pickFirst(runtimeConfig?.clientID, import.meta.env.VITE_ASGARDEO_CLIENT_ID, ""),
  baseUrl:
    pickFirst(runtimeConfig?.baseUrl, import.meta.env.VITE_ASGARDEO_BASE_URL) ||
    "https://api.asgardeo.io/t/theenukagranex",
  scope: resolvedScopes,
};

if (!authConfig.clientID) {
  console.warn("VITE_ASGARDEO_CLIENT_ID is not set. Auth flows will fail.");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* 3. Wrap the whole app with AuthProvider */}
    <AuthProvider config={ authConfig }>
      <QueryClientProvider client={queryClient}>
        <AppContextProvider>
          <SearchContextProvider>
            <App />
          </SearchContextProvider>
        </AppContextProvider>
      </QueryClientProvider>
    </AuthProvider>
  </React.StrictMode>
);