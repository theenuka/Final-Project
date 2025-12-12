import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { extractBearerToken, hasRequiredRole, verifyAsgardeoJwt } from "../../../../../shared/auth/asgardeo";

const JWT_SECRET = (process.env.JWT_SECRET_KEY || "dev_secret") as jwt.Secret;
const INTERNAL_SERVICE_API_KEY = process.env.INTERNAL_SERVICE_API_KEY;

export type AuthedRequest = Request & {
  userId?: string;
  role?: "user" | "admin" | "hotel_owner";
  roles?: Array<"user" | "admin" | "hotel_owner" | string>;
};

export const verifyToken = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  const token = extractBearerToken(req.headers.authorization as string | undefined);
  if (!token) return res.status(401).json({ message: "unauthorized" });

  try {
    const user = await verifyAsgardeoJwt(token);
    req.userId = user.userId;
    req.roles = user.roles as Array<"user" | "admin" | "hotel_owner">;
    req.role = user.roles.find((role) => ["user", "admin", "hotel_owner"].includes(role)) as
      | "user"
      | "admin"
      | "hotel_owner"
      | undefined;
    return next();
  } catch (asgardeoError) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role?: "user" | "admin" | "hotel_owner" };
      req.userId = decoded.userId;
      req.role = decoded.role;
      return next();
    } catch {
      console.warn("[identity-service] token verification failed", (asgardeoError as Error)?.message || asgardeoError);
      return res.status(401).json({ message: "invalid token" });
    }
  }
};

export const requireRole = (roles: Array<"user" | "admin" | "hotel_owner">) => (req: AuthedRequest, res: Response, next: NextFunction) => {
  const effectiveRoles = req.roles?.length ? req.roles : req.role ? [req.role] : [];
  if (!hasRequiredRole(effectiveRoles, roles)) {
    return res.status(403).json({ message: "forbidden" });
  }
  next();
};

export const verifyServiceKey = (req: Request, res: Response, next: NextFunction) => {
  if (!INTERNAL_SERVICE_API_KEY) {
    return res.status(503).json({ message: "service key not configured" });
  }
  const providedKey = req.header("x-service-key");
  if (!providedKey || providedKey !== INTERNAL_SERVICE_API_KEY) {
    return res.status(401).json({ message: "unauthorized" });
  }
  next();
};
