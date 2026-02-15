import express, { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { Board } from '../models/Board';
import { BoardMember } from '../models/BoardMember';
import { List } from '../models/List';
import { auth } from '../middleware/auth';
import { requireBoardRole } from '../middleware/boardRole';
import { AuthRequest } from '../types';

const router = Router();

/**
 * Apply authentication middleware to all board routes.
 * Only logged-in users can access these routes.
 */
router.use(auth);

/**
 * GET ALL BOARDS FOR LOGGED-IN USER
 * 
 * - Finds all board memberships for the user
 * - Populates board details
 * - Returns boards along with user's role in each board
 */
router.get('/', async (req: AuthRequest, res: express.Response) => {

  const memberships = await BoardMember.find({ user: req.userId })
    .populate('board')
    .sort({ createdAt: -1 });

  // Add role information to each board
  const boards = memberships.map((m) => ({
    ...(m.board as any).toObject(),
    role: m.role
  }));

  res.json({ boards });
});


/**
 * CREATE BOARD
 * 
 * - Validates board name
 * - Creates board
 * - Automatically assigns creator as admin
 */
router.post(
  '/',
  [body('name').trim().notEmpty().withMessage('Board name is required')],
  async (req: AuthRequest, res: express.Response) => {

    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    // Create new board
    const board = await Board.create({
      name: req.body.name,
      createdBy: req.userId
    });

    // Add creator as admin in BoardMember collection
    await BoardMember.create({
      board: board._id,
      user: req.userId!,
      role: 'admin'
    });

    res.status(201).json({ board });
  }
);


/**
 * GET SINGLE BOARD
 * 
 * - Validates boardId
 * - Checks if user has access (admin/editor/viewer)
 * - Returns board details + user's role
 */
router.get(
  '/:boardId',
  param('boardId').isMongoId(),
  requireBoardRole('admin', 'editor', 'viewer'),
  async (req: any, res) => {

    const board = await Board.findById(req.params.boardId)
      .populate('createdBy', 'name email');

    if (!board)
      return res.status(404).json({ error: 'Board not found' });

    const role = req.boardRole;

    res.json({
      board: { ...board.toObject(), role }
    });
  }
);


/**
 * UPDATE BOARD
 * 
 * - Only admin or editor can update
 * - Allows updating board name
 */
router.patch(
  '/:boardId',
  param('boardId').isMongoId(),
  body('name').trim().notEmpty().optional(),
  requireBoardRole('admin', 'editor'),
  async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const board = await Board.findByIdAndUpdate(
      req.params.boardId,
      { ...(req.body.name && { name: req.body.name }) },
      { new: true }
    );

    if (!board)
      return res.status(404).json({ error: 'Board not found' });

    res.json({ board });
  }
);


/**
 * DELETE BOARD
 * 
 * - Only admin can delete
 * - Deletes:
 *   1. Board
 *   2. Board members
 *   3. Lists inside board
 * 
 * (You could also delete cards for full cleanup)
 */
router.delete(
  '/:boardId',
  param('boardId').isMongoId(),
  requireBoardRole('admin'),
  async (req, res) => {

    const board = await Board.findByIdAndDelete(req.params.boardId);

    if (!board)
      return res.status(404).json({ error: 'Board not found' });

    // Remove related memberships
    await BoardMember.deleteMany({ board: board._id });

    // Remove related lists
    await List.deleteMany({ board: board._id });

    res.json({ message: 'Board deleted' });
  }
);

export default router;
