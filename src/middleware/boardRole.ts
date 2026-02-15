import { Response, NextFunction } from 'express';
import { BoardMember } from '../models/BoardMember';
import { BoardRole } from '../types';
import { AuthRequest } from '../types';

/**
 * Middleware to check if a user has one of the required roles
 * to access a specific board.
 * 
 * Example usage:
 * requireBoardRole('Admin')
 * requireBoardRole('Admin', 'Editor')
 */
export function requireBoardRole(...allowedRoles: BoardRole[]) {

  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {

    // Get boardId from request parameters
    // Some routes may use :boardId, others may use :id
    const boardId = req.params.boardId || req.params.id;

    // Get logged-in user's ID (added by auth middleware)
    const userId = req.userId;

    // If userId or boardId is missing, deny access
    if (!userId || !boardId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      // Check if the user is a member of this board
      const membership = await BoardMember.findOne({
        board: boardId,
        user: userId
      });

      // If user is not a member, block access
      if (!membership) {
        res.status(403).json({
          error: 'You do not have access to this board.'
        });
        return;
      }

      // Check if user's role is allowed for this action
      if (!allowedRoles.includes(membership.role as BoardRole)) {
        res.status(403).json({
          error: 'Insufficient permissions.'
        });
        return;
      }

      // Attach user's board role to request (optional, useful later)
      (req as AuthRequest & { boardRole: BoardRole }).boardRole =
        membership.role as BoardRole;

      // If everything is valid, move to next controller
      next();

    } catch (err) {
      // Handle unexpected server errors
      res.status(500).json({ error: 'Server error' });
    }
  };
}
