type RuntimeConfig = {
  signInRedirectURL?: string;
  signOutRedirectURL?: string;
  clientID?: string;
  baseUrl?: string;
  scope?: string | string[];
  apiBaseUrl?: string;
  stripePublishableKey?: string;
};

export const pickFirst = <T,>(...values: Array<T | undefined | null>) => {
  return values.find(
    (value) => value !== undefined && value !== null && value !== ""
  ) as T | undefined;
};

const sanitizeUrl = (value: string) => {
  if (!value) return value;
  const trimmed = value.replace(/\/+$/, "");
  return trimmed || "/";
};

const isBrowser = () => typeof window !== "undefined";

const isLocalHost = () => {
  if (!isBrowser()) return false;
  const hostname = window.location.hostname;
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".local")
  );
};

const getBrowserDefaultApiBase = () => {
  if (!isBrowser()) {
    return "http://localhost:7008";
  }

  if (window.location.hostname === "mern-booking-hotel.netlify.app") {
    return "https://mern-hotel-booking-68ej.onrender.com";
  }

  return window.location.origin;
};

export const getRuntimeConfig = (): RuntimeConfig | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.__ASGARDEO_CONFIG ?? undefined;
};

export const resolveApiBaseUrl = () => {
  const runtimeOverride = getRuntimeConfig()?.apiBaseUrl;
  const fallbackBase = getBrowserDefaultApiBase();
  const envConfigured = import.meta.env.VITE_API_BASE_URL?.trim();

  const shouldPreferSameOrigin = () => {
    if (!isBrowser()) return false;
    if (!isLocalHost()) return false;
    // Always prefer same origin in development to use Vite proxy
    return true;
  };

  const sameOriginDevBase = shouldPreferSameOrigin()
    ? window.location.origin
    : undefined;

  const selected =
    pickFirst(runtimeOverride, !shouldPreferSameOrigin() ? envConfigured : undefined, sameOriginDevBase, fallbackBase) ??
    fallbackBase;

  return sanitizeUrl(selected);
};

export const resolveStripePublishableKey = (): string | undefined => {
  return pickFirst<string | undefined>(
    getRuntimeConfig()?.stripePublishableKey,
    import.meta.env.VITE_STRIPE_PUB_KEY,
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  );
};
