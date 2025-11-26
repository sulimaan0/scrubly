import { db } from "./db";
import { NextRequest } from "next/server";

/**
 * Extract Bearer token from Authorization header
 */
export function getTokenFromHeader(req: Request | NextRequest): string | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Validate a mobile auth token and return the session if valid
 */
export async function validateMobileToken(token: string) {
  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || new Date(session.expiresAt) < new Date()) {
    return null;
  }

  return session;
}

/**
 * Get mobile session from request (convenience function)
 */
export async function getMobileSession(req: Request | NextRequest) {
  const token = getTokenFromHeader(req);
  if (!token) {
    return null;
  }
  return validateMobileToken(token);
}
