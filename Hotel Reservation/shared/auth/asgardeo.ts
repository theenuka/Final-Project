import { createRemoteJWKSet, JWTPayload, jwtVerify } from "jose";

export type AsgardeoConfig = {
  issuer: string;
  audience: string;
  jwksUrl: string;
};

const getEnv = (key: string, fallback?: string) => {
  if (process.env[key]) return process.env[key] as string;
  return fallback;
};

const tenant =
  getEnv("ASGARDEO_TENANT_DOMAIN") ||
  getEnv("ASGARDEO_TENANT") ||
  getEnv("ASGARDEO_ORGANIZATION");
const orgBaseUrl =
  getEnv("ASGARDEO_ORG_URL") ||
  (tenant ? `https://api.asgardeo.io/t/${tenant}` : undefined);

const defaultIssuer = orgBaseUrl ? `${orgBaseUrl}/oauth2/token` : undefined;
const defaultJwks = orgBaseUrl ? `${orgBaseUrl}/oauth2/jwks` : undefined;

const asgardeoConfig: AsgardeoConfig = {
  issuer: getEnv("ASGARDEO_ISSUER", defaultIssuer) || "",
  audience: getEnv("ASGARDEO_CLIENT_ID") || getEnv("ASGARDEO_AUDIENCE") || "",
  jwksUrl: getEnv("ASGARDEO_JWKS_URL", defaultJwks) || "",
};

if (!asgardeoConfig.issuer || !asgardeoConfig.audience || !asgardeoConfig.jwksUrl) {
  console.warn(
    "[asgardeo-auth] Missing Asgardeo configuration. Please set ASGARDEO_CLIENT_ID, ASGARDEO_TENANT_DOMAIN (or ASGARDEO_ORG_URL), and optionally ASGARDEO_ISSUER."
  );
}

const jwks = asgardeoConfig.jwksUrl
  ? createRemoteJWKSet(new URL(asgardeoConfig.jwksUrl))
  : null;

export type VerifiedAsgardeoUser = {
  userId: string;
  email?: string;
  username?: string;
  roles: string[];
  tenant?: string;
  payload: JWTPayload;
};

const extractRoles = (payload: JWTPayload): string[] => {
  const roleClaims = [
    payload.roles,
    payload["http://wso2.org/claims/role"],
    payload.groups,
    payload["cognito:groups"],
    payload.scope,
    payload["custom:roles"],
  ];

  const roles = roleClaims
    .flatMap((claim) => {
      if (!claim) return [] as string[];
      if (Array.isArray(claim)) return claim.map(String);
      if (typeof claim === "string") return claim.split(/[ ,]/).map((role) => role.trim()).filter(Boolean);
      return [] as string[];
    })
    .filter(Boolean);

  return Array.from(new Set(roles));
};

export const extractBearerToken = (authHeader?: string): string | undefined => {
  if (!authHeader) return undefined;
  if (authHeader.startsWith("Bearer ")) return authHeader.slice(7).trim();
  if (authHeader.startsWith("bearer ")) return authHeader.slice(7).trim();
  return undefined;
};

export const verifyAsgardeoJwt = async (token: string): Promise<VerifiedAsgardeoUser> => {
  if (!jwks || !asgardeoConfig.issuer || !asgardeoConfig.audience) {
    throw new Error("Asgardeo configuration is incomplete");
  }

  const { payload } = await jwtVerify(token, jwks, {
    issuer: asgardeoConfig.issuer,
    audience: asgardeoConfig.audience,
  });

  const roles = extractRoles(payload);
  const email = (payload.email as string | undefined) || (payload["preferred_username"] as string | undefined);
  const username = (payload.username as string | undefined) || email;

  return {
    userId: payload.sub || email || username || "",
    email,
    username,
    roles,
    tenant,
    payload,
  };
};

export const hasRequiredRole = (userRoles: string[] | undefined, required: string[]): boolean => {
  if (!required.length) return true;
  if (!userRoles || !userRoles.length) return false;
  const normalizedUserRoles = userRoles.map((role) => role.toLowerCase());
  return required.some((role) => normalizedUserRoles.includes(role.toLowerCase()));
};
