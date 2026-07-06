import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyforbookingapp';

// Register a new user
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Please provide name, email, and password.' });
  }

  try {
    // Check if email already exists
    const [userExists] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (userExists.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists.', code: 'USER_EXISTS' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userId = crypto.randomUUID();

    // Insert user
    await pool.query(
      'INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)',
      [userId, name, email, passwordHash]
    );

    // Generate JWT token
    const token = jwt.sign({ id: userId, email: email }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        name: name,
        email: email,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password.' });
  }

  try {
    // Check if user exists
    const [result] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (result.length === 0) {
      return res.status(404).json({ error: 'Account not found. Please create one.', code: 'USER_NOT_FOUND' });
    }

    const user = result[0];

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'password is incorrect', code: 'WRONG_PASSWORD' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = ?', [req.user.id]);
    if (result.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json(result[0]);
  } catch (err) {
    console.error('Fetch user error:', err);
    res.status(500).json({ error: 'Server error fetching profile.' });
  }
});

// Forgot Password - Generate token and send email
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: 'Please provide your email address.' });

  try {
    const [result] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (result.length === 0) {
      // Return 200 even if user not found for security (prevent email enumeration)
      return res.status(200).json({ message: 'If that email is registered, a reset link has been sent.' });
    }

    const userId = result[0].id;
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    await pool.query(
      'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
      [resetToken, tokenExpiry, userId]
    );

    // Import email utility dynamically or at top. Since we didn't add it at top, we can use dynamic import or require.
    // Actually, let's just use the dynamic import to avoid top-level import issues if file is missing.
    const { sendPasswordResetEmail } = await import('../utils/email.js');
    await sendPasswordResetEmail(email, resetToken);

    res.status(200).json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error processing your request.' });
  }
});

// Reset Password - Verify token and update password
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Invalid request. Missing token or password.' });
  }

  try {
    const [result] = await pool.query(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
      [token]
    );

    if (result.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    }

    const userId = result[0].id;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await pool.query(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
      [passwordHash, userId]
    );

    res.status(200).json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error resetting password.' });
  }
});
// Update user profile (name)
router.put('/profile', authenticateToken, async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const userId = req.user.id;
    await pool.query('UPDATE users SET name = ? WHERE id = ?', [name.trim(), userId]);
    
    // Return updated user profile
    const [rows] = await pool.query('SELECT id, email, name FROM users WHERE id = ?', [userId]);
    res.json(rows[0]);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

// Change user password
router.put('/password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }

  try {
    const userId = req.user.id;
    
    // Get current password hash
    const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = rows[0];
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    
    // Update password
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
    
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Server error updating password' });
  }
});

export default router;
