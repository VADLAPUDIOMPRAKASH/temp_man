import { Request } from 'express';

/**
 * Role types for board members
 * - admin  : Full access (delete board, manage members)
 * - editor : Can modify lists/cards
 * - viewer : Read-only access
 */
export type BoardRole = 'admin' | 'editor' | 'viewer';

/**
 * Extended Express Request
 * 
 * Used after authentication middleware.
 * Adds:
 * - userId (from JWT)
 * - boardRole (from requireBoardRole middleware)
 */
export interface AuthRequest extends Request {
  userId?: string;
  boardRole?: BoardRole;
}

/**
 * JWT Payload structure
 * 
 * This is the structure encoded inside the JWT token.
 */
export interface JwtPayload {
  userId: string;
  email: string;
}
