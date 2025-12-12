import { Request, Response, NextFunction } from "express";
import { extractBearerToken, verifyAsgardeoJwt } from "../../../../../shared/auth/asgardeo";
import { notificationConfig } from "../config";

export type AuthedRequest = Request & { userId?: string; roles?: string[] };

export const attachUser = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  // Check gateway headers first
  const headerUserId = req.headers["x-user-id"] as string | undefined;
  const headerRoles = (req.headers["x-user-roles"] as string | undefined)?.split(",").filter(Boolean);
  if (headerUserId) {
    req.userId = headerUserId;
    req.roles = headerRoles;
    return next();
  }

  // Try JWT verification
  const token = extractBearerToken(req.headers.authorization as string | undefined);
  if (!token) return res.status(401).json({ message: "unauthorized" });

  try {
    const user = await verifyAsgardeoJwt(token);
    req.userId = user.userId;
    req.roles = user.roles;
    next();
  } catch (error) {
    console.warn("[notification-service] token verification failed", (error as Error)?.message || error);
    return res.status(401).json({ message: "unauthorized" });
  }
};

export const verifyServiceKey = (req: Request, res: Response, next: NextFunction) => {
  if (notificationConfig.disableAuth || !notificationConfig.serviceKey) return next();
  const provided = (req.headers["x-service-key"] || req.headers["x-api-key"]) as string | undefined;
  if (provided && provided === notificationConfig.serviceKey) return next();
  return res.status(401).json({ message: "invalid service key" });
};
