let provider: (() => Promise<string | undefined>) | null = null;

export const registerAccessTokenProvider = (fn: () => Promise<string | undefined>) => {
  provider = fn;
};

export const clearAccessTokenProvider = () => {
  provider = null;
};

export const getAccessTokenFromProvider = async (): Promise<string | undefined> => {
  if (!provider) return undefined;
  try {
    return await provider();
  } catch (error) {
    console.warn("[asgardeo-token] Unable to retrieve access token", (error as Error)?.message || error);
    return undefined;
  }
};
