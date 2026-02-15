import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { List } from '../models/List';
import { Card } from '../models/Card';
import { auth } from '../middleware/auth';
import { requireBoardRole } from '../middleware/boardRole';
import { AuthRequest } from '../types';

const router = Router({ mergeParams: true });

router.use(auth);

const boardIdParam = param('boardId').isMongoId();

router.get(
  '/',
  boardIdParam,
  requireBoardRole('admin', 'editor', 'viewer'),
  async (req, res) => {
    const lists = await List.find({ board: req.params.boardId }).sort('order');
    res.json({ lists });
  }
);

router.post(
  '/',
  boardIdParam,
  body('title').trim().notEmpty().withMessage('Title is required'),
  requireBoardRole('admin', 'editor'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const count = await List.countDocuments({ board: req.params.boardId });
    const list = await List.create({
      title: req.body.title,
      board: req.params.boardId,
      order: count,
    });
    res.status(201).json({ list });
  }
);

router.patch(
  '/:listId',
  boardIdParam,
  param('listId').isMongoId(),
  body('title').trim().notEmpty().optional(),
  body('order').isInt().optional(),
  requireBoardRole('admin', 'editor'),
  async (req, res) => {
    const list = await List.findOne({
      _id: req.params.listId,
      board: req.params.boardId,
    });
    if (!list) return res.status(404).json({ error: 'List not found' });
    if (req.body.title !== undefined) list.title = req.body.title;
    if (req.body.order !== undefined) list.order = req.body.order;
    await list.save();
    res.json({ list });
  }
);

router.delete(
  '/:listId',
  boardIdParam,
  param('listId').isMongoId(),
  requireBoardRole('admin', 'editor'),
  async (req, res) => {
    const list = await List.findOneAndDelete({
      _id: req.params.listId,
      board: req.params.boardId,
    });
    if (!list) return res.status(404).json({ error: 'List not found' });
    await Card.deleteMany({ list: list._id });
    res.json({ message: 'List deleted' });
  }
);

router.post(
  '/reorder',
  boardIdParam,
  body('listIds').isArray().withMessage('listIds must be an array'),
  requireBoardRole('admin', 'editor'),
  async (req, res) => {
    const { listIds } = req.body;
    for (let i = 0; i < listIds.length; i++) {
      await List.findOneAndUpdate(
        { _id: listIds[i], board: req.params.boardId },
        { order: i }
      );
    }
    const lists = await List.find({ board: req.params.boardId }).sort('order');
    res.json({ lists });
  }
);

export default router;
