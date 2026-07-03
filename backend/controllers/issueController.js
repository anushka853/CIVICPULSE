import Issue from '../models/issueModel.js';
import User from '../models/userModel.js';
import Activity from '../models/activityModel.js';
import { analyzeIssueImage, verifyIssueResolution, recommendStaffForIssue } from '../config/geminiService.js';
import { checkAndAssignBadges } from './userController.js';
import { sendEmail } from '../utils/emailService.js';
import { sendRealTimeNotification } from '../server.js';
import path from 'path';

// Helper to log system/citizen activities
export const logActivity = async (userId, text, type) => {
  try {
    await Activity.create({ user: userId, text, type });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// @desc    Pre-analyze image via Gemini AI
// @route   POST /api/issues/analyze
// @access  Private
export const analyzeImage = async (req, res) => {
  const imageFile = req.files && req.files['image'] ? req.files['image'][0] : null;
  const voiceFile = req.files && req.files['voice'] ? req.files['voice'][0] : null;

  if (!imageFile) {
    return res.status(400).json({ message: 'Please upload an image to analyze' });
  }

  try {
    const relativeImagePath = imageFile.path.replace(/\\/g, '/');
    const absoluteImagePath = path.resolve(imageFile.path);
    const imageMimeType = imageFile.mimetype;

    let absoluteVoicePath = null;
    let voiceMimeType = null;

    if (voiceFile) {
      absoluteVoicePath = path.resolve(voiceFile.path);
      voiceMimeType = voiceFile.mimetype;
    }

    const analysis = await analyzeIssueImage(absoluteImagePath, imageMimeType, absoluteVoicePath, voiceMimeType);
    
    res.json({
      imageUrl: `/${relativeImagePath}`,
      analysis,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new issue
// @route   POST /api/issues
// @access  Private
export const createIssue = async (req, res) => {
  const {
    title,
    description,
    category,
    image,
    images,
    latitude,
    longitude,
    state,
    district,
    city,
    village,
    landmark,
    severity,
    safetySuggestions,
  } = req.body;

  try {
    const issue = await Issue.create({
      reporter: req.user._id,
      title,
      description,
      category,
      image,
      images: images && images.length > 0 ? images : [image],
      latitude: Number(latitude),
      longitude: Number(longitude),
      state,
      district,
      city,
      village,
      landmark,
      severity,
      safetySuggestions,
    });

    // Reward reporter XP and increment count
    const user = await User.findById(req.user._id);
    if (user) {
      user.points += 10; // 10 XP for reporting
      user.reportedCount += 1;
      checkAndAssignBadges(user);
      await user.save();
      await logActivity(req.user._id, `${user.name} reported a new issue: "${title}" (+10 XP)`, 'report');
      
      // In-app real-time notifications
      sendRealTimeNotification(req.user._id, { text: `Your complaint "${title}" has been successfully reported (+10 XP).`, type: 'success' });
      sendRealTimeNotification(null, { text: `New community report: "${title}" in ${city || state}`, type: 'info' });


      // Send email to Citizen
      await sendEmail({
        to: user.email,
        subject: `[CivicPulse] Complaint Filed: ${title}`,
        text: `Hello ${user.name},\n\nYour complaint "${title}" in category "${category}" has been filed.\nLocation: State: ${state}, District: ${district}, City: ${city}, Village/Ward: ${village}.\n\nThank you for active civic contribution!`,
        html: `<h3>Hello ${user.name},</h3><p>Your complaint <strong>"${title}"</strong> has been successfully reported.</p><p><strong>Location:</strong> ${village}, ${city}, ${district}, ${state}</p><p>We will assign a working staff member shortly.</p>`
      });

      // Send email to Admin
      await sendEmail({
        to: 'admin@civicpulse.gov.in',
        subject: `[ALERT] New Complaint Filed: ${title}`,
        text: `A new complaint has been filed by ${user.name}.\nTitle: ${title}\nCategory: ${category}\nSeverity: ${severity}\nLocation details: State: ${state}, District: ${district}, City: ${city}, Village: ${village}.`,
        html: `<h3>New Complaint Alert</h3><p>A new complaint has been filed by citizen <strong>${user.name}</strong>.</p><p><strong>Title:</strong> ${title}</p><p><strong>Severity:</strong> ${severity}</p><p>Please assign a working staff member to resolve it.</p>`
      });
    }

    res.status(201).json(issue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all issues
// @route   GET /api/issues
// @access  Public
export const getIssues = async (req, res) => {
  try {
    const { category, status } = req.query;
    const filter = {};
    
    if (category) filter.category = category;
    if (status) filter.status = status;

    const issues = await Issue.find(filter)
      .populate('reporter', 'name email points level')
      .sort({ createdAt: -1 });

    res.json(issues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get issue by ID
// @route   GET /api/issues/:id
// @access  Public
export const getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('reporter', 'name email points level')
      .populate('resolvedBy', 'name email');

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    res.json(issue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify issue (upvote / downvote)
// @route   POST /api/issues/:id/verify
// @access  Private
export const verifyIssue = async (req, res) => {
  const { action } = req.body; // 'upvote' or 'downvote'
  const userId = req.user._id;

  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    if (issue.reporter.toString() === userId.toString()) {
      return res.status(400).json({ message: 'You cannot verify your own reported issues' });
    }

    const hasUpvoted = issue.upvotes.includes(userId);
    const hasDownvoted = issue.downvotes.includes(userId);

    const verifier = await User.findById(userId);

    if (action === 'upvote') {
      if (hasUpvoted) {
        return res.status(400).json({ message: 'Already verified (upvoted) this issue' });
      }

      // Remove from downvotes if existed
      if (hasDownvoted) {
        issue.downvotes = issue.downvotes.filter(id => id.toString() !== userId.toString());
      }
      issue.upvotes.push(userId);

      // Award 2 XP to the verifier
      if (verifier) {
        verifier.points += 2;
        verifier.verifiedCount += 1;
        checkAndAssignBadges(verifier);
        await verifier.save();
        await logActivity(userId, `${verifier.name} verified the report "${issue.title}" (+2 XP)`, 'upvote');
      }

      // Check if threshold reached to auto-verify
      // e.g. net verifications = upvotes - downvotes
      const net = issue.upvotes.length - issue.downvotes.length;
      if (net >= 3 && issue.status === 'Reported') {
        issue.status = 'Verified';
        await logActivity(null, `Community consensus reached for "${issue.title}". Status promoted to VERIFIED.`, 'system');

        // Auto-assign Working Staff based on category
        let staffEmail = '';
        let cost = 0;

        if (issue.category === 'Waste Management') {
          staffEmail = 'rajesh@civicpulse.org';
          cost = 1500;
        } else if (issue.category === 'Potholes & Roads') {
          staffEmail = 'vinay@civicpulse.org';
          cost = 5000;
        } else if (issue.category === 'Water Leakage') {
          staffEmail = 'manoj@civicpulse.org';
          cost = 3000;
        } else if (issue.category === 'Damaged Streetlights') {
          staffEmail = 'vinod@civicpulse.org';
          cost = 1200;
        } else if (issue.category === 'Public Infrastructure') {
          staffEmail = 'vinay@civicpulse.org';
          cost = 4500;
        }

        if (staffEmail) {
          const staffUser = await User.findOne({ email: staffEmail });
          if (staffUser) {
            issue.assignedStaff = staffUser._id;
            issue.status = 'In Progress';
            issue.cost = cost;
            await logActivity(staffUser._id, `System auto-routed and assigned ${staffUser.name} to resolve "${issue.title}". Status set to IN PROGRESS.`, 'assign');
            
            // In-app real-time notifications
            sendRealTimeNotification(staffUser._id, { text: `You have been auto-assigned to resolve the complaint: "${issue.title}".`, type: 'info' });
            sendRealTimeNotification(issue.reporter, { text: `Your complaint "${issue.title}" has been assigned to ${staffUser.name}.`, type: 'info' });


            // Send notification email to Staff
            await sendEmail({
              to: staffUser.email,
              subject: `[Task Assigned] New Cleanup Job: ${issue.title}`,
              text: `Hello ${staffUser.name},\n\nYou have been auto-assigned to resolve the complaint "${issue.title}".\nLocation: https://maps.google.com/?q=${issue.latitude},${issue.longitude}\n\nPlease check your workspace dashboard for details.`,
              html: `<h3>Task Assigned</h3><p>Hello ${staffUser.name},</p><p>You have been assigned to: <strong>"${issue.title}"</strong>.</p>`
            });

            // Send email to Citizen Reporter
            const reporter = await User.findById(issue.reporter);
            if (reporter) {
              await sendEmail({
                to: reporter.email,
                subject: `[CivicPulse] Complaint Assigned: ${issue.title}`,
                text: `Hello ${reporter.name},\n\nYour reported complaint "${issue.title}" has been assigned to field worker ${staffUser.name}.\nCleanup is starting soon!`,
                html: `<h3>Complaint Status Update</h3><p>Your reported issue has been assigned to field worker <strong>${staffUser.name}</strong>.</p>`
              });
            }
          }
        }
      }

    } else if (action === 'downvote') {
      if (hasDownvoted) {
        return res.status(400).json({ message: 'Already downvoted this issue' });
      }

      // Remove from upvotes if existed
      if (hasUpvoted) {
        issue.upvotes = issue.upvotes.filter(id => id.toString() !== userId.toString());
      }
      issue.downvotes.push(userId);

      if (verifier) {
        verifier.points += 2; // still reward engagement points for checking reports
        verifier.verifiedCount += 1;
        checkAndAssignBadges(verifier);
        await verifier.save();
        await logActivity(userId, `${verifier.name} flagged the report "${issue.title}" as spam/invalid`, 'upvote');
      }

      // If net verifications drop below -3, can archive/hide issue or mark as spam
      const net = issue.upvotes.length - issue.downvotes.length;
      if (net <= -3) {
        issue.status = 'Reported'; // reset or archive
        await logActivity(null, `Report "${issue.title}" flagged heavily as spam by the community.`, 'system');
      }
    } else {
      return res.status(400).json({ message: 'Invalid action type' });
    }

    await issue.save();
    res.json(issue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resolve issue (Upload photo & compare using Gemini AI)
// @route   PUT /api/issues/:id/resolve
// @access  Private/Admin
export const resolveIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    if (issue.status === 'Resolved') {
      return res.status(400).json({ message: 'Issue is already resolved' });
    }

    let resolvedRelativePath = issue.resolutionImage;
    let resolvedAbsPath = '';

    if (req.file) {
      resolvedRelativePath = `/${req.file.path.replace(/\\/g, '/')}`;
      resolvedAbsPath = path.resolve(req.file.path);
    } else if (issue.resolutionImage) {
      resolvedAbsPath = path.resolve(issue.resolutionImage.substring(1));
    } else {
      return res.status(400).json({ message: 'Please upload or provide a resolution verification photo' });
    }

    const originalAbsPath = path.resolve(issue.image.substring(1)); // strip leading slash

    // Call Gemini AI resolution verification
    const verification = await verifyIssueResolution(
      originalAbsPath,
      resolvedAbsPath,
      issue.category
    );

    // Update Issue status
    issue.status = 'Resolved';
    issue.resolutionImage = resolvedRelativePath;
    issue.aiResolutionConfidence = verification.confidence;
    issue.aiResolutionResult = verification.result;
    issue.aiResolutionDetails = verification.details;
    issue.resolvedBy = req.user._id;
    issue.resolvedAt = Date.now();

    await issue.save();

    // Reward original reporter: +50 XP
    const reporter = await User.findById(issue.reporter);
    if (reporter) {
      reporter.points += 50;
      checkAndAssignBadges(reporter);
      await reporter.save();
      await logActivity(reporter._id, `${reporter.name}'s reported issue "${issue.title}" has been RESOLVED! (+50 XP)`, 'resolve');
      
      // In-app real-time notification
      sendRealTimeNotification(reporter._id, { text: `Your reported complaint "${issue.title}" has been RESOLVED! (+50 XP)`, type: 'success' });


      // Email citizen
      await sendEmail({
        to: reporter.email,
        subject: `[RESOLVED] Complaint "${issue.title}" Verified Cleaned`,
        text: `Hello ${reporter.name},\n\nWe are pleased to inform you that your reported complaint "${issue.title}" has been officially resolved.\nGemini AI verification match: ${verification.result} (Confidence: ${verification.confidence}%).\n\nThank you for your active participation!`,
        html: `<h3>Hello ${reporter.name},</h3><p>Your reported complaint <strong>"${issue.title}"</strong> has been successfully resolved.</p><p><strong>AI Audit verdict:</strong> ${verification.result} (${verification.confidence}% confidence)</p><p>Thank you for contributing to a Clean India!</p>`
      });
    }

    // Reward assigned staff: +20 XP
    if (issue.assignedStaff) {
      const staff = await User.findById(issue.assignedStaff);
      if (staff) {
        staff.points += 20;
        checkAndAssignBadges(staff);
        await staff.save();
        await logActivity(staff._id, `Staff member ${staff.name} earned +20 XP for resolving "${issue.title}"`, 'resolve');
        
        // In-app real-time notification
        sendRealTimeNotification(staff._id, { text: `Your proof for "${issue.title}" was approved by Admin! (+20 XP)`, type: 'success' });


        // Email staff
        await sendEmail({
          to: staff.email,
          subject: `[Audit Approved] Task Approved: ${issue.title}`,
          text: `Hello ${staff.name},\n\nYour submitted proof for "${issue.title}" has been approved by the Admin.\nAI Verdict: ${verification.result} (Confidence: ${verification.confidence}%).\n\nYou earned +20 XP!`,
          html: `<h3>Audit Approved</h3><p>Hello ${staff.name},</p><p>Your submitted proof for <strong>"${issue.title}"</strong> has been approved.</p><p><strong>AI Verdict:</strong> ${verification.result} (${verification.confidence}% confidence)</p>`
        });
      }
    }

    // Reward all verifiers (upvoters): +10 XP
    for (const verifierId of issue.upvotes) {
      const verifier = await User.findById(verifierId);
      if (verifier) {
        verifier.points += 10;
        checkAndAssignBadges(verifier);
        await verifier.save();
      }
    }

    // Resolve duplicates merged into this
    const duplicates = await Issue.find({ isDuplicateOf: issue._id });
    for (let dup of duplicates) {
      dup.status = 'Resolved';
      dup.resolutionImage = resolvedRelativePath;
      dup.aiResolutionConfidence = verification.confidence;
      dup.aiResolutionDetails = `Resolved automatically via merge (Merged with resolved issue: "${issue.title}").`;
      dup.resolvedBy = req.user._id;
      dup.resolvedAt = Date.now();
      await dup.save();

      const dupReporter = await User.findById(dup.reporter);
      if (dupReporter) {
        dupReporter.points += 30;
        checkAndAssignBadges(dupReporter);
        await dupReporter.save();
        await logActivity(dupReporter._id, `${dupReporter.name}'s duplicate report "${dup.title}" resolved via merge (+30 XP)`, 'resolve');
      }
    }

    await logActivity(req.user._id, `Municipal Admin officially verified and resolved "${issue.title}" via Gemini Audit`, 'resolve');

    res.json({
      issue,
      aiAnalysis: verification,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Staff check-in near the issue location
// @route   PUT /api/issues/:id/check-in
// @access  Private
export const checkInStaff = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    if (issue.assignedStaff && issue.assignedStaff.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not assigned to this issue' });
    }

    issue.checkInVerified = true;
    await issue.save();

    await logActivity(req.user._id, `Staff member ${req.user.name} checked-in at location for "${issue.title}"`, 'assign');
    
    // In-app real-time notification
    sendRealTimeNotification(issue.reporter, { text: `Staff worker ${req.user.name} has checked-in and started cleaning "${issue.title}".`, type: 'info' });


    // Notify Reporter
    const reporter = await User.findById(issue.reporter);
    if (reporter) {
      await sendEmail({
        to: reporter.email,
        subject: `[CivicPulse] Cleaning Started: ${issue.title}`,
        text: `Hello ${reporter.name},\n\nStaff worker "${req.user.name}" has arrived at the coordinates and checked-in. Cleanup is now in progress!`,
        html: `<h3>Cleanup In Progress</h3><p>Hello ${reporter.name},</p><p>Staff worker <strong>${req.user.name}</strong> has arrived at the location and checked-in. Cleanup has started!</p>`
      });
    }

    // Notify Admin
    await sendEmail({
      to: 'admin@civicpulse.gov.in',
      subject: `[ALERT] Staff Checked-In: ${issue.title}`,
      text: `Staff worker "${req.user.name}" has checked-in at the location of complaint "${issue.title}".`,
      html: `<h3>Staff Checked-In</h3><p>Staff worker <strong>${req.user.name}</strong> has checked-in for task <strong>"${issue.title}"</strong>.</p>`
    });

    res.json(issue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Staff uploads fix proof photo and marks complete
// @route   PUT /api/issues/:id/complete
// @access  Private
export const completeStaffIssue = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a resolution proof photo' });
  }

  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    if (issue.assignedStaff && issue.assignedStaff.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not assigned to this issue' });
    }

    if (!issue.checkInVerified) {
      return res.status(400).json({ message: 'Please check-in at location before completing the issue' });
    }

    const relativePath = req.file.path.replace(/\\/g, '/');
    issue.status = 'Completed';
    issue.resolutionImage = `/${relativePath}`;
    await issue.save();

    await logActivity(req.user._id, `Staff ${req.user.name} completed work on "${issue.title}". Pending Admin Audit.`, 'assign');
    
    // In-app real-time notifications
    sendRealTimeNotification(issue.reporter, { text: `Field worker ${req.user.name} has finished cleaning "${issue.title}". Awaiting final audit.`, type: 'info' });
    sendRealTimeNotification(null, { text: `Staff ${req.user.name} completed "${issue.title}". Audit required.`, type: 'info' });


    // Notify Reporter
    const reporter = await User.findById(issue.reporter);
    if (reporter) {
      await sendEmail({
        to: reporter.email,
        subject: `[CivicPulse] Cleanup Completed (Awaiting Verification): ${issue.title}`,
        text: `Hello ${reporter.name},\n\nField worker ${req.user.name} has completed cleaning and uploaded verification photos.\nOur Municipal Admin is currently auditing the resolution.`,
        html: `<h3>Cleanup Completed</h3><p>Hello ${reporter.name},</p><p>Field worker <strong>${req.user.name}</strong> has finished cleaning and uploaded photos. Awaiting final audit verification.</p>`
      });
    }

    // Notify Admin
    await sendEmail({
      to: 'admin@civicpulse.gov.in',
      subject: `[ACTION REQUIRED] Audit Task: ${issue.title}`,
      text: `Staff worker "${req.user.name}" has marked the task "${issue.title}" as completed.\n\nPlease review proof and run the Gemini AI audit in the Admin portal.`,
      html: `<h3>Audit Required</h3><p>Staff worker <strong>${req.user.name}</strong> has completed <strong>"${issue.title}"</strong>.</p><p>Please review proof and run the Gemini AI audit.</p>`
    });

    res.json(issue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign issue to Working Staff member
// @route   PUT /api/issues/:id/assign
// @access  Private/Admin
export const assignIssue = async (req, res) => {
  const { staffId } = req.body;

  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    const staffUser = await User.findById(staffId);
    if (!staffUser || staffUser.role !== 'Staff') {
      return res.status(400).json({ message: 'Selected user is not a valid Staff member' });
    }

    issue.assignedStaff = staffUser._id;
    issue.status = 'In Progress';
    
    // Set cost based on category if not set
    if (!issue.cost) {
      if (issue.category === 'Waste Management') issue.cost = 1500;
      else if (issue.category === 'Potholes & Roads') issue.cost = 5000;
      else if (issue.category === 'Water Leakage') issue.cost = 3000;
      else if (issue.category === 'Damaged Streetlights') issue.cost = 1200;
      else issue.cost = 2500;
    }

    await issue.save();

    await logActivity(staffUser._id, `Municipal Admin manually assigned ${staffUser.name} to resolve "${issue.title}"`, 'assign');
    
    // In-app real-time notifications
    sendRealTimeNotification(staffUser._id, { text: `Admin assigned you to resolve: "${issue.title}".`, type: 'info' });
    sendRealTimeNotification(issue.reporter, { text: `Your complaint "${issue.title}" has been assigned to ${staffUser.name}.`, type: 'info' });


    // Notify Staff
    await sendEmail({
      to: staffUser.email,
      subject: `[Task Assigned] New Cleanup Job: ${issue.title}`,
      text: `Hello ${staffUser.name},\n\nYou have been assigned to resolve the complaint "${issue.title}".\nLocation: https://maps.google.com/?q=${issue.latitude},${issue.longitude}\n\nPlease check your workspace dashboard for details.`,
      html: `<h3>Task Assigned</h3><p>Hello ${staffUser.name},</p><p>You have been assigned to: <strong>"${issue.title}"</strong>.</p>`
    });

    // Notify Reporter
    const reporter = await User.findById(issue.reporter);
    if (reporter) {
      await sendEmail({
        to: reporter.email,
        subject: `[CivicPulse] Complaint Assigned: ${issue.title}`,
        text: `Hello ${reporter.name},\n\nYour reported complaint "${issue.title}" has been assigned to field worker ${staffUser.name}.\nCleanup is starting soon!`,
        html: `<h3>Complaint Status Update</h3><p>Your reported issue has been assigned to field worker <strong>${staffUser.name}</strong>.</p>`
      });
    }

    res.json(issue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Merge duplicate issue into a parent issue
// @route   POST /api/issues/:id/merge
// @access  Private/Admin
export const mergeIssues = async (req, res) => {
  const { duplicateId } = req.body;

  try {
    const parentIssue = await Issue.findById(req.params.id);
    const duplicateIssue = await Issue.findById(duplicateId);

    if (!parentIssue || !duplicateIssue) {
      return res.status(404).json({ message: 'Parent or duplicate issue not found' });
    }

    duplicateIssue.isDuplicateOf = parentIssue._id;
    duplicateIssue.status = 'In Progress'; // Sync status with parent
    await duplicateIssue.save();

    await logActivity(req.user._id, `Municipal Admin merged duplicate report "${duplicateIssue.title}" into "${parentIssue.title}"`, 'merge');

    res.json({ message: 'Issues successfully merged', parentIssue, duplicateIssue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dynamic notifications/activities
// @route   GET /api/issues/activities
// @access  Private
export const getActivities = async (req, res) => {
  try {
    const activities = await Activity.find({})
      .populate('user', 'name role')
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard analytics & predictive hotspots
// @route   GET /api/issues/analytics
// @access  Public
export const getAnalytics = async (req, res) => {
  try {
    const totalIssues = await Issue.countDocuments();
    const resolvedIssues = await Issue.countDocuments({ status: 'Resolved' });
    const activeIssues = totalIssues - resolvedIssues;

    // Group by category
    const categoryStats = await Issue.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Group by status
    const statusStats = await Issue.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Calculate total cost spent on resolving issues
    const totalCostResult = await Issue.aggregate([
      { $match: { status: 'Resolved' } },
      { $group: { _id: null, totalCost: { $sum: '$cost' } } }
    ]);
    const totalCost = totalCostResult.length > 0 ? totalCostResult[0].totalCost : 0;

    // Spatial clustering for "Predictive Hotspots" (Municipal Priorities)
    // Basic clustering algorithm: Group issues within 0.01 coordinate delta (approx 1.1km)
    const allIssues = await Issue.find({ status: { $ne: 'Resolved' } }).select('latitude longitude category title');
    const hotspots = [];
    const thresholdDistance = 0.01; // ~1km

    allIssues.forEach((issue) => {
      let foundHotspot = false;
      for (let hs of hotspots) {
        const dist = Math.sqrt(
          Math.pow(hs.latitude - issue.latitude, 2) +
          Math.pow(hs.longitude - issue.longitude, 2)
        );
        if (dist <= thresholdDistance) {
          hs.count += 1;
          hs.categories[issue.category] = (hs.categories[issue.category] || 0) + 1;
          hs.issues.push(issue._id);
          foundHotspot = true;
          break;
        }
      }
      if (!foundHotspot) {
        hotspots.push({
          latitude: issue.latitude,
          longitude: issue.longitude,
          count: 1,
          categories: { [issue.category]: 1 },
          issues: [issue._id],
        });
      }
    });

    // Filter and sort hotspots with 2 or more reports to represent actual congestion
    const priorityHotspots = hotspots
      .filter(h => h.count >= 2)
      .map(h => {
        // Find dominant category
        let dominantCategory = '';
        let maxCount = 0;
        for (let cat in h.categories) {
          if (h.categories[cat] > maxCount) {
            maxCount = h.categories[cat];
            dominantCategory = cat;
          }
        }
        return {
          latitude: h.latitude,
          longitude: h.longitude,
          count: h.count,
          dominantCategory,
          riskLevel: h.count >= 4 ? 'High Risk' : 'Moderate Risk',
        };
      })
      .sort((a, b) => b.count - a.count);

    res.json({
      summary: {
        totalIssues,
        resolvedIssues,
        activeIssues,
        resolutionRate: totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0,
        totalCost,
      },
      categoryStats,
      statusStats,
      predictiveHotspots: priorityHotspots,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Recommend best staff member for an issue using Gemini AI
// @route   GET /api/issues/:id/recommend-staff
// @access  Private/Admin
export const recommendStaff = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    const staffList = await User.find({ role: 'Staff' }).select('name email points level state district city village serviceArea workingRadius');
    if (staffList.length === 0) {
      return res.status(400).json({ message: 'No working staff members found' });
    }

    const recommendation = await recommendStaffForIssue(issue, staffList);
    res.json(recommendation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

