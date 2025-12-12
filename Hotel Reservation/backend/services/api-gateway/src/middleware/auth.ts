import { Response, NextFunction } from "express";
import { Request } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export interface AuthedRequest extends Request {
  userId?: string;
  role?: "user" | "admin" | "hotel_owner";
}

export const verifyToken = (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return next(); // No token, proceed without authentication
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role?: "user" | "admin" | "hotel_owner";
    };
    req.userId = decoded.userId;
    req.role = decoded.role;
  } catch (error) {
    // Invalid token, but we don't want to block public routes
    // Services themselves should handle fine-grained access control
    console.warn("Invalid JWT token provided:", error.message);
  }

  next();
};

export const requireRole = (
  roles: Array<"user" | "admin" | "hotel_owner">
) => (req: AuthedRequest, res: Response, next: NextFunction) => {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const hasRole = req.role && roles.includes(req.role);

  if (!hasRole) {
    return res
      .status(403)
      .json({ message: "Forbidden: Insufficient permissions" });
  }

  next();
};
