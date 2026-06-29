import User from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';

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
  const { name, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'Citizen',
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
        level: user.level,
        badges: user.badges,
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
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
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
