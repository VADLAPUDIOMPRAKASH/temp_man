import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Card } from '../models/Card';
import { List } from '../models/List';
import { Comment } from '../models/Comment';
import { Activity } from '../models/Activity';
import { BoardMember } from '../models/BoardMember';
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
    const lists = await List.find({ board: req.params.boardId }).select('_id');
    const listIds = lists.map((l) => l._id);
    const cards = await Card.find({ list: { $in: listIds } })
      .populate('createdBy', 'name email')
      .sort('order');
    res.json({ cards });
  }
);

router.post(
  '/',
  boardIdParam,
  body('listId').isMongoId(),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().trim(),
  body('dueDate').optional().isISO8601(),
  body('labels').optional().isArray(),
  requireBoardRole('admin', 'editor'),
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const list = await List.findOne({
      _id: req.body.listId,
      board: req.params.boardId,
    });
    if (!list) return res.status(404).json({ error: 'List not found' });
    const count = await Card.countDocuments({ list: list._id });
    const card = await Card.create({
      title: req.body.title,
      description: req.body.description || '',
      list: list._id,
      order: count,
      dueDate: req.body.dueDate,
      labels: req.body.labels || [],
      createdBy: req.userId,
    });
    await Activity.create({
      card: card._id,
      user: req.userId!,
      action: 'created',
      details: `Card "${card.title}" created`,
    });
    const populated = await Card.findById(card._id).populate('createdBy', 'name email');
    res.status(201).json({ card: populated });
  }
);

router.get(
  '/:cardId',
  boardIdParam,
  param('cardId').isMongoId(),
  requireBoardRole('admin', 'editor', 'viewer'),
  async (req, res) => {
    const card = await Card.findById(req.params.cardId)
      .populate('createdBy', 'name email')
      .populate('list');
    if (!card) return res.status(404).json({ error: 'Card not found' });
    const list = await List.findById((card.list as any)._id);
    if (!list || list.board.toString() !== req.params.boardId) {
      return res.status(404).json({ error: 'Card not found' });
    }
    const [comments, activities] = await Promise.all([
      Comment.find({ card: card._id }).populate('user', 'name email').sort('-createdAt'),
      Activity.find({ card: card._id }).populate('user', 'name email').sort('-createdAt'),
    ]);
    res.json({ card, comments, activities });
  }
);

router.patch(
  '/:cardId',
  boardIdParam,
  param('cardId').isMongoId(),
  body('title').trim().notEmpty().optional(),
  body('description').optional().trim(),
  body('dueDate').optional(),
  body('labels').optional().isArray(),
  body('listId').optional().isMongoId(),
  body('order').optional().isInt(),
  requireBoardRole('admin', 'editor'),
  async (req: AuthRequest, res) => {
    const card = await Card.findById(req.params.cardId).populate('list');
    if (!card) return res.status(404).json({ error: 'Card not found' });
    const list = card.list as any;
    if (!list || list.board.toString() !== req.params.boardId) {
      return res.status(404).json({ error: 'Card not found' });
    }
    const updates: string[] = [];
    if (req.body.title !== undefined) {
      card.title = req.body.title;
      updates.push('title');
    }
    if (req.body.description !== undefined) card.description = req.body.description;
    if (req.body.dueDate !== undefined) card.dueDate = req.body.dueDate || undefined;
    if (req.body.labels !== undefined) card.labels = req.body.labels;
    if (req.body.listId !== undefined) {
      const newList = await List.findOne({
        _id: req.body.listId,
        board: req.params.boardId,
      });
      if (!newList) return res.status(404).json({ error: 'Target list not found' });
      card.list = newList._id;
      updates.push('moved');
    }
    if (req.body.order !== undefined) card.order = req.body.order;
    await card.save();
    for (const action of updates) {
      await Activity.create({
        card: card._id,
        user: req.userId!,
        action,
        details: action === 'moved' ? `Moved to another list` : undefined,
      });
    }
    const populated = await Card.findById(card._id).populate('createdBy', 'name email').populate('list');
    res.json({ card: populated });
  }
);

router.delete(
  '/:cardId',
  boardIdParam,
  param('cardId').isMongoId(),
  requireBoardRole('admin', 'editor'),
  async (req, res) => {
    const card = await Card.findById(req.params.cardId).populate('list');
    if (!card) return res.status(404).json({ error: 'Card not found' });
    const list = card.list as any;
    if (!list || list.board.toString() !== req.params.boardId) {
      return res.status(404).json({ error: 'Card not found' });
    }
    await Card.findByIdAndDelete(card._id);
    await Comment.deleteMany({ card: card._id });
    await Activity.deleteMany({ card: card._id });
    res.json({ message: 'Card deleted' });
  }
);

router.post(
  '/:cardId/comments',
  boardIdParam,
  param('cardId').isMongoId(),
  body('text').trim().notEmpty().withMessage('Comment text is required'),
  requireBoardRole('admin', 'editor', 'viewer'),
  async (req: AuthRequest, res) => {
    const card = await Card.findById(req.params.cardId).populate('list');
    if (!card) return res.status(404).json({ error: 'Card not found' });
    const list = card.list as any;
    if (!list || list.board.toString() !== req.params.boardId) {
      return res.status(404).json({ error: 'Card not found' });
    }
    const comment = await Comment.create({
      card: card._id,
      user: req.userId!,
      text: req.body.text,
    });
    await Activity.create({
      card: card._id,
      user: req.userId!,
      action: 'comment',
      details: req.body.text.slice(0, 50),
    });
    const populated = await Comment.findById(comment._id).populate('user', 'name email');
    res.status(201).json({ comment: populated });
  }
);

router.post(
  '/:cardId/attachments',
  boardIdParam,
  param('cardId').isMongoId(),
  body('name').trim().notEmpty(),
  body('mimeType').trim().notEmpty(),
  body('size').isInt(),
  body('data').trim().notEmpty(),
  requireBoardRole('admin', 'editor'),
  async (req, res) => {
    const card = await Card.findById(req.params.cardId).populate('list');
    if (!card) return res.status(404).json({ error: 'Card not found' });
    const list = card.list as any;
    if (!list || list.board.toString() !== req.params.boardId) {
      return res.status(404).json({ error: 'Card not found' });
    }
    card.attachments.push({
      name: req.body.name,
      mimeType: req.body.mimeType,
      size: req.body.size,
      data: req.body.data,
      uploadedAt: new Date(),
    });
    await card.save();
    res.json({ card });
  }
);

router.get(
  '/:cardId/attachments/:attachmentIndex',
  boardIdParam,
  param('cardId').isMongoId(),
  param('attachmentIndex').isInt(),
  requireBoardRole('admin', 'editor', 'viewer'),
  async (req, res) => {
    const card = await Card.findById(req.params.cardId).populate('list');
    if (!card) return res.status(404).json({ error: 'Card not found' });
    const list = card.list as any;
    if (!list || list.board.toString() !== req.params.boardId) {
      return res.status(404).json({ error: 'Card not found' });
    }
    
    const index = parseInt(req.params.attachmentIndex);
    const attachment = card.attachments[index];
    
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }
    
    // Convert Base64 back to buffer
    const buffer = Buffer.from(attachment.data, 'base64');
    
    // Set appropriate headers
    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.name}"`);
    res.setHeader('Content-Length', buffer.length);
    
    res.send(buffer);
  }
);

export default router;
