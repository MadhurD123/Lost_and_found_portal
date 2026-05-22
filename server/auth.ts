import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DB } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'campus-super-secret-token-key-2026';

// Extend Request types inside this module
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    username: string;
    email: string;
    isAdmin: boolean;
  };
}

/**
 * Authentication Middleware
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Authentication required. Please log in.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      username: string;
      email: string;
      isAdmin: boolean;
    };
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired session token. Please log in again.' });
  }
}

/**
 * Admin Check Middleware
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || !req.user.isAdmin) {
    res.status(403).json({ message: 'Forbidden. Admin access required.' });
    return;
  }
  next();
}

const authRouter = Router();

/**
 * @route POST /api/auth/signup
 */
authRouter.post('/signup', async (req: Request, res: Response) => {
  try {
    const { username, email, password, department, studentId } = req.body;

    // Simple robust validation
    if (!username || !email || !password) {
      res.status(400).json({ message: 'Username, Email, and Password are required.' });
      return;
    }

    // Check pre-existing username
    const existingUser = await DB.users.findOne({ username });
    if (existingUser) {
      res.status(400).json({ message: 'Username already in use on campus.' });
      return;
    }

    // Check pre-existing email
    const existingEmail = await DB.users.findOne({ email });
    if (existingEmail) {
      res.status(400).json({ message: 'Email is already registered.' });
      return;
    }

    // Hash the password with bcryptjs
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Seed special Admin account check
    const isOwnerAdmin = username.toLowerCase() === 'admin' || email.toLowerCase().startsWith('admin@');

    // Create student user context
    const created = await DB.users.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      department: department?.trim() || '',
      studentId: studentId?.trim() || '',
      isAdmin: isOwnerAdmin
    });

    // Create session JWT token
    const token = jwt.sign(
      { userId: created._id, username: created.username, email: created.email, isAdmin: created.isAdmin },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Student Registration Successful!',
      token,
      user: {
        userId: created._id,
        username: created.username,
        email: created.email,
        department: created.department,
        studentId: created.studentId,
        isAdmin: created.isAdmin
      }
    });

  } catch (err: any) {
    console.error('Error in student signup application flow:', err);
    res.status(500).json({ message: 'Internal server error during registration.' });
  }
});

/**
 * @route POST /api/auth/login
 */
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ message: 'Username and password are required.' });
      return;
    }

    const user = await DB.users.findOne({ username: username.trim() });
    if (!user) {
      res.status(401).json({ message: 'Invalid Username or Student ID on campus.' });
      return;
    }

    // Compare bcrypt passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Incorrect Password. Please try again.' });
      return;
    }

    // Generate response token
    const token = jwt.sign(
      { userId: user._id, username: user.username, email: user.email, isAdmin: !!user.isAdmin },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login Successful!',
      token,
      user: {
        userId: user._id,
        username: user.username,
        email: user.email,
        department: user.department,
        studentId: user.studentId,
        isAdmin: !!user.isAdmin
      }
    });

  } catch (err: any) {
    console.error('Error in student login application flow:', err);
    res.status(500).json({ message: 'Internal server error during login verification.' });
  }
});

/**
 * @route GET /api/auth/me
 */
authRouter.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userDetails = await DB.users.findById(req.user!.userId);
    if (!userDetails) {
      res.status(404).json({ message: 'Session owner student details could not be found.' });
      return;
    }

    res.status(200).json({
      user: {
        userId: userDetails._id,
        username: userDetails.username,
        email: userDetails.email,
        department: userDetails.department,
        studentId: userDetails.studentId,
        isAdmin: !!userDetails.isAdmin
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Network or database error.' });
  }
});

export { authRouter };
