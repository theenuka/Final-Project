import { Request, Response, NextFunction } from "express";
import { extractBearerToken, hasRequiredRole, verifyAsgardeoJwt } from "../../../../../shared/auth/asgardeo";

export type AuthedRequest = Request & { userId?: string; roles?: string[]; email?: string };

export const verifyToken = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  const token = extractBearerToken(req.headers.authorization as string | undefined);
  if (!token) {
    return res.status(401).json({ message: "unauthorized" });
  }

  try {
    const user = await verifyAsgardeoJwt(token);
    req.userId = user.userId;
    req.roles = user.roles;
    req.email = user.email;
    next();
  } catch (error) {
    console.warn("[hotel-service] token verification failed", (error as Error)?.message || error);
    return res.status(401).json({ message: "invalid token" });
  }
};

export const requireRole = (roles: string[]) => (req: AuthedRequest, res: Response, next: NextFunction) => {
  const headerRoles = (req.headers["x-user-roles"] as string | undefined)?.split(",").filter(Boolean);
  const effectiveRoles = req.roles?.length ? req.roles : headerRoles;
  if (hasRequiredRole(effectiveRoles, roles)) {
    return next();
  }
  return res.status(403).json({ message: "forbidden" });
};

export const requireOwner = requireRole(["hotel_owner", "admin"]);
