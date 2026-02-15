import express, { Router } from 'express';
import { query, validationResult } from 'express-validator';
import { Card } from '../models/Card';
import { List } from '../models/List';
import { BoardMember } from '../models/BoardMember';
import { auth } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

router.use(auth);

router.get(
  '/',
  [
    query('q').optional().trim(),
    query('dueDate').optional().isIn(['overdue', 'today', 'week', 'none']),
    query('labels').optional(),
    query('boardId').optional().isMongoId(),
  ],
  async (req: AuthRequest, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { q, dueDate, labels, boardId } = req.query;

    const memberships = await BoardMember.find({ user: req.userId }).select('board');
    const allowedBoardIds = memberships.map((m) => m.board);
    const filter: any = {};

    if (boardId) {
      if (!allowedBoardIds.some((id) => id.toString() === boardId)) {
        return res.status(403).json({ error: 'Access denied to this board' });
      }
      const listIds = (await List.find({ board: boardId }).select('_id')).map((l) => l._id);
      filter.list = { $in: listIds };
    } else {
      const listIds = await List.find({ board: { $in: allowedBoardIds } }).select('_id');
      filter.list = { $in: listIds.map((l) => l._id) };
    }

    if (q && String(q).trim()) {
      filter.$text = { $search: String(q).trim() };
    }
    if (labels) {
      const labelArr = Array.isArray(labels) ? labels : [labels];
      filter.labels = { $in: labelArr.map(String) };
    }
    if (dueDate) {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
      const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);
      switch (dueDate) {
        case 'overdue':
          filter.dueDate = { $lt: startOfToday, $ne: null };
          break;
        case 'today':
          filter.dueDate = { $gte: startOfToday, $lt: endOfToday };
          break;
        case 'week':
          filter.dueDate = { $gte: startOfToday, $lt: endOfWeek };
          break;
        case 'none':
          filter.$or = [{ dueDate: null }, { dueDate: { $exists: false } }];
          break;
      }
    }

    const cards = await Card.find(filter)
      .populate('createdBy', 'name email')
      .populate('list')
      .sort('-updatedAt')
      .limit(100);
    res.json({ cards });
  }
);

export default router;
