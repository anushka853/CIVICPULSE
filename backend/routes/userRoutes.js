import express from 'express';
import {
  registerUser,
  authUser,
  googleLogin,
  getUserProfile,
  getLeaderboard,
  getStaffUsers,
  sendOtp,
  verifyOtp,
  forgotPassword,
  resetPassword,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/google-login', googleLogin);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/profile', protect, getUserProfile);
router.get('/leaderboard', getLeaderboard);
router.get('/staff', protect, getStaffUsers);

export default router;
