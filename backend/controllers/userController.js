import User from '../models/userModel.js';
import Otp from '../models/otpModel.js';
import generateToken from '../utils/generateToken.js';
import { sendEmail } from '../utils/emailService.js';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

// Helper to check and assign badges to a user based on stats
export const checkAndAssignBadges = (user) => {
  const newBadges = [...user.badges];
  let updated = false;

  // Badge 1: First Report (Spotter)
  if (user.reportedCount >= 1 && !newBadges.includes('Spotter')) {
    newBadges.push('Spotter');
    updated = true;
  }

  // Badge 2: 5 Reports (Civic Guard)
  if (user.reportedCount >= 5 && !newBadges.includes('Civic Guard')) {
    newBadges.push('Civic Guard');
    updated = true;
  }

  // Badge 3: 5 Verifications (Trustworthy Verifier)
  if (user.verifiedCount >= 5 && !newBadges.includes('Trustworthy Verifier')) {
    newBadges.push('Trustworthy Verifier');
    updated = true;
  }

  // Badge 4: High Points (City Hero)
  if (user.points >= 200 && !newBadges.includes('City Hero')) {
    newBadges.push('City Hero');
    updated = true;
  }

  if (updated) {
    user.badges = newBadges;
  }

  // Dynamically calculate level: Level 1 for 0-49 XP, Level 2 for 50-99 XP, etc.
  const newLevel = Math.floor(user.points / 50) + 1;
  user.level = newLevel;
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
export const registerUser = async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    mobile,
    state,
    district,
    city,
    village,
    pinCode,
    serviceArea,
    workingRadius,
    otp,
  } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Verify OTP
    const record = await Otp.findOne({ email, otp, purpose: 'verification' });
    if (!record) {
      return res.status(400).json({ message: 'Invalid or expired OTP verification code' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'Citizen',
      mobile,
      state,
      district,
      city,
      village,
      pinCode,
      serviceArea,
      workingRadius: workingRadius ? Number(workingRadius) : 5,
      isVerified: true,
    });

    if (user) {
      // Delete OTP
      await Otp.deleteOne({ _id: record._id });

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
        level: user.level,
        badges: user.badges,
        mobile: user.mobile,
        state: user.state,
        district: user.district,
        city: user.city,
        village: user.village,
        pinCode: user.pinCode,
        serviceArea: user.serviceArea,
        workingRadius: user.workingRadius,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
export const authUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
        level: user.level,
        badges: user.badges,
        mobile: user.mobile,
        state: user.state,
        district: user.district,
        city: user.city,
        village: user.village,
        pinCode: user.pinCode,
        serviceArea: user.serviceArea,
        workingRadius: user.workingRadius,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send OTP to email
// @route   POST /api/users/send-otp
// @access  Public
export const sendOtp = async (req, res) => {
  const { email, purpose } = req.body;
  if (!email || !purpose) {
    return res.status(400).json({ message: 'Please provide email and purpose (verification/reset).' });
  }
  try {
    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save to OTP database
    await Otp.findOneAndUpdate(
      { email, purpose },
      { otp, createdAt: Date.now() },
      { upsert: true, new: true }
    );

    // Send email
    const subject = purpose === 'verification' ? 'Verify Your CivicPulse Account' : 'Reset Your CivicPulse Password';
    const text = `Your 6-digit OTP code for CivicPulse AI is: ${otp}. It will expire in 10 minutes.`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>CivicPulse AI Notification</h2>
        <p>You requested a one-time code for account ${purpose === 'verification' ? 'verification' : 'password reset'}.</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #0ea5e9; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code is valid for 10 minutes. If you did not request this code, please ignore this email.</p>
      </div>
    `;

    await sendEmail({ to: email, subject, text, html });
    const isMock = !process.env.SMTP_USER || !process.env.SMTP_PASS;
    res.json({ 
      message: 'OTP sent successfully',
      devOtp: isMock ? otp : undefined
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify OTP
// @route   POST /api/users/verify-otp
// @access  Public
export const verifyOtp = async (req, res) => {
  const { email, otp, purpose } = req.body;
  if (!email || !otp || !purpose) {
    return res.status(400).json({ message: 'Please fill all fields' });
  }
  try {
    const record = await Otp.findOne({ email, otp, purpose });
    if (!record) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Forgot Password - Send Reset Link/OTP
// @route   POST /api/users/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No user registered with this email address' });
    }
    req.body.purpose = 'reset';
    return await sendOtp(req, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset Password using OTP
// @route   POST /api/users/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: 'Please provide all details' });
  }
  try {
    const record = await Otp.findOne({ email, otp, purpose: 'reset' });
    if (!record) {
      return res.status(400).json({ message: 'Invalid or expired OTP code' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    await Otp.deleteOne({ _id: record._id });

    await sendEmail({
      to: email,
      subject: 'CivicPulse Password Changed',
      text: 'Hello, your CivicPulse account password was reset successfully.',
      html: `<h3>Password Reset Complete</h3><p>Hello, your CivicPulse account password has been updated successfully.</p>`
    });

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      // Refresh badges and level just in case
      checkAndAssignBadges(user);
      await user.save();

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
        level: user.level,
        reportedCount: user.reportedCount,
        verifiedCount: user.verifiedCount,
        badges: user.badges,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get leaderboard
// @route   GET /api/users/leaderboard
// @access  Public
export const getLeaderboard = async (req, res) => {
  try {
    const users = await User.find({ role: 'Citizen' })
      .select('name points level badges reportedCount')
      .sort({ points: -1 })
      .limit(10);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all Working Staff users
// @route   GET /api/users/staff
// @access  Private
export const getStaffUsers = async (req, res) => {
  try {
    const staff = await User.find({ role: 'Staff' }).select('name email points level');
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user via Google OAuth & get token
// @route   POST /api/users/google-login
// @access  Public
export const googleLogin = async (req, res) => {
  const { credential, role } = req.body;
  if (!credential) {
    return res.status(400).json({ message: 'Google credential token is required' });
  }

  try {
    let payload;
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (clientId) {
      try {
        const client = new OAuth2Client(clientId);
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: clientId,
        });
        payload = ticket.getPayload();
      } catch (err) {
        console.warn('Google ID token verification failed via google-auth-library, checking fallback decode:', err.message);
        payload = jwt.decode(credential);
      }
    } else {
      console.warn('GOOGLE_CLIENT_ID not defined. Decoding token as fallback (Sandbox Mode).');
      payload = jwt.decode(credential);
    }

    if (!payload || !payload.email) {
      return res.status(400).json({ message: 'Invalid or malformed Google Token' });
    }

    const { email, name, sub } = payload;

    // Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new Citizen user
      user = await User.create({
        name: name || email.split('@')[0],
        email: email,
        googleEmail: email,
        googleId: sub,
        password: Math.random().toString(36).slice(-8) + 'GoogleAuth123!', // Random password for schema validation
        role: role || 'Citizen',
        isVerified: true, // Google account is verified
        state: 'Bihar',
        district: 'Patna',
        city: 'Patna',
        village: 'Ward 12',
        pinCode: '800001',
      });
    } else {
      // User exists. Update google details if not set
      let updated = false;
      if (!user.googleEmail) {
        user.googleEmail = email;
        updated = true;
      }
      if (!user.googleId) {
        user.googleId = sub;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      googleEmail: user.googleEmail,
      role: user.role,
      points: user.points,
      level: user.level,
      badges: user.badges,
      mobile: user.mobile,
      state: user.state,
      district: user.district,
      city: user.city,
      village: user.village,
      pinCode: user.pinCode,
      serviceArea: user.serviceArea,
      workingRadius: user.workingRadius,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

