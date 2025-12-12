import React, { useEffect, useMemo, useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { useToast } from "../hooks/use-toast";
import { useAuthContext } from "@asgardeo/auth-react";
import {
  clearAccessTokenProvider,
  registerAccessTokenProvider,
} from "../lib/asgardeo-token-bridge";
import { resolveStripePublishableKey } from "../lib/runtime-config";

const STRIPE_PUB_KEY = resolveStripePublishableKey();

if (!STRIPE_PUB_KEY) {
  console.warn(
    "Stripe publishable key is not configured. Payment flows will be disabled until VITE_STRIPE_PUB_KEY (or runtime-config stripePublishableKey) is set."
  );
}

type ToastMessage = {
  title: string;
  description?: string;
  type: "SUCCESS" | "ERROR" | "INFO";
};

export type AppContext = {
  showToast: (toastMessage: ToastMessage) => void;
  isLoggedIn: boolean;
  userRoles: string[];
  userEmail?: string;
  stripePromise: Promise<Stripe | null>;
  showGlobalLoading: (message?: string) => void;
  hideGlobalLoading: () => void;
  isGlobalLoading: boolean;
  globalLoadingMessage: string;
};

export const AppContext = React.createContext<AppContext | undefined>(
  undefined
);

const stripePromise: Promise<Stripe | null> = STRIPE_PUB_KEY
  ? loadStripe(STRIPE_PUB_KEY)
  : Promise.resolve(null);

export const AppContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [globalLoadingMessage, setGlobalLoadingMessage] = useState(
    "Hotel room is getting ready..."
  );
  const { toast } = useToast();
  const { state, getAccessToken } = useAuthContext();

  useEffect(() => {
    registerAccessTokenProvider(async () => {
      if (!state.isAuthenticated) return undefined;
      return (await getAccessToken()) || undefined;
    });
    return () => clearAccessTokenProvider();
  }, [getAccessToken, state.isAuthenticated]);

  const userRoles = useMemo(() => {
    const decodedState = state as unknown as {
      decodedAccessToken?: { payload?: Record<string, unknown> };
      decodedIdToken?: { payload?: Record<string, unknown> };
      profileInfo?: Record<string, unknown>;
    };

    const candidates = [
      decodedState?.decodedAccessToken?.payload?.roles,
      decodedState?.decodedAccessToken?.payload?.groups,
      decodedState?.decodedIdToken?.payload?.roles,
      decodedState?.decodedIdToken?.payload?.groups,
      decodedState?.profileInfo?.roles,
      decodedState?.profileInfo?.groups,
    ];

    const roles = candidates
      .flatMap((claim) => {
        if (!claim) return [] as string[];
        if (Array.isArray(claim)) return claim.map(String);
        if (typeof claim === "string") {
          return claim
            .split(/[ ,]/)
            .map((role) => role.trim())
            .filter(Boolean);
        }
        return [] as string[];
      })
      .filter(Boolean);

    return Array.from(new Set(roles.map((role) => role.toLowerCase())));
  }, [state]);

  const isLoggedIn = state.isAuthenticated;

  const showToast = (toastMessage: ToastMessage) => {
    const variant =
      toastMessage.type === "SUCCESS"
        ? "success"
        : toastMessage.type === "ERROR"
        ? "destructive"
        : "info";

    toast({
      variant,
      title: toastMessage.title,
      description: toastMessage.description,
    });
  };

  const showGlobalLoading = (message?: string) => {
    if (message) {
      setGlobalLoadingMessage(message);
    }
    setIsGlobalLoading(true);
  };

  const hideGlobalLoading = () => {
    setIsGlobalLoading(false);
  };

  return (
    <AppContext.Provider
      value={{
        showToast,
        isLoggedIn,
        userRoles,
        userEmail: state?.email || state?.username || state?.displayName,
        stripePromise,
        showGlobalLoading,
        hideGlobalLoading,
        isGlobalLoading,
        globalLoadingMessage,
      }}
    >
      {isGlobalLoading && <LoadingSpinner message={globalLoadingMessage} />}
      {children}
    </AppContext.Provider>
  );
};

// ...existing code...
