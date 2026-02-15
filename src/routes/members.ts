import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { User } from '../models/User';
import { BoardMember } from '../models/BoardMember';
import { auth } from '../middleware/auth';
import { requireBoardRole } from '../middleware/boardRole';
import { AuthRequest } from '../types';
import { BoardRole } from '../types';

const router = Router({ mergeParams: true });

router.use(auth);

router.get(
  '/',
  param('boardId').isMongoId(),
  requireBoardRole('admin', 'editor', 'viewer'),
  async (req, res) => {
    const members = await BoardMember.find({ board: req.params.boardId })
      .populate('user', 'name email')
      .populate('invitedBy', 'name');
    res.json({ members });
  }
);

router.post(
  '/invite',
  param('boardId').isMongoId(),
  body('email').isEmail().normalizeEmail(),
  body('role').isIn(['admin', 'editor', 'viewer']),
  requireBoardRole('admin'),
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ error: 'User not found with this email.' });
    const existing = await BoardMember.findOne({
      board: req.params.boardId,
      user: user._id,
    });
    if (existing) return res.status(400).json({ error: 'User is already a member.' });
    const member = await BoardMember.create({
      board: req.params.boardId,
      user: user._id,
      role: req.body.role as BoardRole,
      invitedBy: req.userId,
    });
    const populated = await BoardMember.findById(member._id)
      .populate('user', 'name email')
      .populate('invitedBy', 'name');
    res.status(201).json({ member: populated });
  }
);

router.patch(
  '/:memberId',
  param('boardId').isMongoId(),
  param('memberId').isMongoId(),
  body('role').isIn(['admin', 'editor', 'viewer']),
  requireBoardRole('admin'),
  async (req, res) => {
    const member = await BoardMember.findOneAndUpdate(
      { _id: req.params.memberId, board: req.params.boardId },
      { role: req.body.role },
      { new: true }
    )
      .populate('user', 'name email')
      .populate('invitedBy', 'name');
    if (!member) return res.status(404).json({ error: 'Member not found' });
    res.json({ member });
  }
);

router.delete(
  '/:memberId',
  param('boardId').isMongoId(),
  param('memberId').isMongoId(),
  requireBoardRole('admin'),
  async (req: AuthRequest, res) => {
    const member = await BoardMember.findOne({
      _id: req.params.memberId,
      board: req.params.boardId,
    });
    if (!member) return res.status(404).json({ error: 'Member not found' });
    if ((member.user as any).toString() === req.userId) {
      return res.status(400).json({ error: 'Cannot remove yourself. Leave or delete the board.' });
    }
    await BoardMember.findByIdAndDelete(member._id);
    res.json({ message: 'Member removed' });
  }
);

export default router;
