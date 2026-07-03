import express from 'express';
import {
  createIssue,
  getIssues,
  getIssueById,
  verifyIssue,
  resolveIssue,
  getAnalytics,
  analyzeImage,
  checkInStaff,
  completeStaffIssue,
  assignIssue,
  mergeIssues,
  getActivities,
  recommendStaff,
} from '../controllers/issueController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/analytics', getAnalytics);
router.get('/activities', protect, getActivities);
router.post('/analyze', protect, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'voice', maxCount: 1 }]), analyzeImage);
router.get('/', getIssues);
router.post('/', protect, createIssue);

router.get('/:id', getIssueById);
router.post('/:id/verify', protect, verifyIssue);
router.put('/:id/resolve', protect, admin, upload.single('resolutionImage'), resolveIssue);
router.put('/:id/check-in', protect, checkInStaff);
router.put('/:id/complete', protect, upload.single('resolutionImage'), completeStaffIssue);
router.put('/:id/assign', protect, admin, assignIssue);
router.post('/:id/merge', protect, admin, mergeIssues);
router.get('/:id/recommend-staff', protect, admin, recommendStaff);

export default router;
