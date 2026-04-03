const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
const register = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Please provide username, email, and password' });
  }

  const userExists = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { username }],
  });

  if (userExists) {
    const field = userExists.email === email.toLowerCase() ? 'email' : 'username';
    return res.status(409).json({ message: `This ${field} is already taken` });
  }

  const user = await User.create({ username, email, password });

  const token = generateToken(user._id);

  res.status(201).json({
    token,
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
    },
  });
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Please provide email/username and password' });
  }

  const user = await User.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier },
    ],
  }).select('+password');

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = generateToken(user._id);

  res.json({
    token,
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
    },
  });
};

// @desc    Get current user
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  res.json({
    user: {
      _id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      avatar: req.user.avatar,
      bio: req.user.bio,
    },
  });
};

// @desc    Send password reset email
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Please provide an email address' });
  }

  // Always return success to avoid revealing valid emails
  const successMsg = 'If that email is registered, a reset link has been sent.';

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.json({ message: successMsg });
  }

  // Generate a short-lived reset token (15 min)
  const resetToken = jwt.sign({ id: user._id, purpose: 'password-reset' }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });

  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  // Send email
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"PixelCritic" <${process.env.SMTP_USER}>`,
    to: user.email,
    subject: 'Reset Your PixelCritic Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #1a1a2e; color: #e0e0e0; padding: 32px; border-radius: 12px;">
        <h1 style="color: #ff5722; text-align: center; margin-bottom: 8px;">PixelCritic</h1>
        <h2 style="text-align: center; color: #ffffff; margin-top: 0;">Password Reset</h2>
        <p>Hi <strong>${user.username}</strong>,</p>
        <p>You requested a password reset. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${resetUrl}" style="background: #ff5722; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Reset Password</a>
        </div>
        <p style="color: #999; font-size: 13px;">This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${user.email}`);
  } catch (err) {
    console.error('Failed to send reset email:', err.message);
    return res.status(500).json({ message: 'Failed to send reset email. Please try again later.' });
  }

  res.json({ message: successMsg });
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: 'Token and new password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'Reset link has expired. Please request a new one.'
      : 'Invalid reset link. Please request a new one.';
    return res.status(400).json({ message: msg });
  }

  if (decoded.purpose !== 'password-reset') {
    return res.status(400).json({ message: 'Invalid reset token' });
  }

  const user = await User.findById(decoded.id).select('+password');
  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }

  user.password = password; // pre-save hook will hash it
  await user.save();

  res.json({ message: 'Password reset successful. You can now log in with your new password.' });
};

module.exports = { register, login, getMe, forgotPassword, resetPassword };
