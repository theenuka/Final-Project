import { Request, Response, NextFunction } from "express";
import { extractBearerToken, verifyAsgardeoJwt } from "../../../../../shared/auth/asgardeo";

export const attachUser = async (req: Request & { userId?: string; roles?: string[] }, _res: Response, next: NextFunction) => {
  if (req.userId) return next();

  const headerUserId = req.headers["x-user-id"] as string | undefined;
  const headerRoles = (req.headers["x-user-roles"] as string | undefined)?.split(",").filter(Boolean);
  if (headerUserId) {
    req.userId = headerUserId;
    req.roles = headerRoles;
    return next();
  }

  const token = extractBearerToken(req.headers.authorization as string | undefined);
  if (!token) return next();

  try {
    const user = await verifyAsgardeoJwt(token);
    req.userId = user.userId;
    req.roles = user.roles;
  } catch (error) {
    console.warn("[booking-service] token verification failed", (error as Error)?.message || error);
  }

  next();
};
