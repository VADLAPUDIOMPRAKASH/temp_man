import express, { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User';
import { auth } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

/**
 * REGISTER ROUTE
 * 
 * Creates a new user account.
 * - Validates input
 * - Checks if email already exists
 * - Hashes password
 * - Generates JWT token
 */
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req: express.Request, res: express.Response) => {

    // Validate request inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    // Hash password before saving
    const hashed = await bcrypt.hash(password, 10);

    // Create new user
    const user = await User.create({ name, email, password: hashed });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    // Return token and user details (excluding password)
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  }
);

/**
 * LOGIN ROUTE
 * 
 * Authenticates user credentials.
 * - Validates input
 * - Checks email & password
 * - Returns JWT token if valid
 */
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req: express.Request, res: express.Response) => {

    // Validate request inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    // Check if user exists and password matches
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    // Return token and user info
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  }
);

/**
 * GET CURRENT USER
 * 
 * Protected route.
 * - Requires valid JWT token
 * - Returns logged-in user's details
 */
router.get('/me', auth, async (req: AuthRequest, res: express.Response) => {

  // Find user by ID (exclude password field)
  const user = await User.findById(req.userId).select('-password');

  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({
    user: { id: user._id, name: user.name, email: user.email }
  });
});

export default router;
