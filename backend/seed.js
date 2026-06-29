import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/userModel.js';
import Issue from './models/issueModel.js';
import Activity from './models/activityModel.js';
import fs from 'fs';
import path from 'path';

// Load env variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/civicpulse';

// Ensure upload directories and dummy image proofs exist
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Create dummy image files if they don't exist, to prevent fs read errors in Gemini API
const createDummyFile = (filename) => {
  const filePath = path.join(uploadDir, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, 'DUMMY_IMAGE_DATA_FOR_MOCKING_TEST');
  }
};
createDummyFile('pothole-original.jpg');
createDummyFile('pothole-fixed.jpg');
createDummyFile('garbage-original.jpg');
createDummyFile('garbage-fixed.jpg');
createDummyFile('water-leak.jpg');
createDummyFile('streetlight.jpg');

const seedDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB Connected for Seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Issue.deleteMany({});
    await Activity.deleteMany({});
    console.log('Cleared existing data.');

    // 1. Create Authority Admin
    const adminUser = await User.create({
      name: 'Municipal Administrator',
      email: 'admin@civicpulse.org',
      password: 'password123', // Mongoose will hash this automatically in save hook
      role: 'Admin',
    });
    console.log('Created Admin User.');

    // 2. Create Working Staff Users
    const staffSanitation = await User.create({
      name: 'Rajesh Kumar',
      email: 'rajesh@civicpulse.org',
      password: 'password123',
      role: 'Staff',
      points: 80,
      level: 2,
    });

    const staffRoads = await User.create({
      name: 'Vinay Singh',
      email: 'vinay@civicpulse.org',
      password: 'password123',
      role: 'Staff',
      points: 150,
      level: 4,
    });

    const staffPlumbing = await User.create({
      name: 'Manoj Gowda',
      email: 'manoj@civicpulse.org',
      password: 'password123',
      role: 'Staff',
      points: 50,
      level: 2,
    });

    const staffElectrical = await User.create({
      name: 'Vinod Sharma',
      email: 'vinod@civicpulse.org',
      password: 'password123',
      role: 'Staff',
      points: 30,
      level: 1,
    });
    console.log('Created Working Staff Users.');

    // 3. Create Citizens
    const citizenAmit = await User.create({
      name: 'Amit Patel',
      email: 'amit@civicpulse.org',
      password: 'password123',
      role: 'Citizen',
      points: 240,
      level: 5,
      reportedCount: 6,
      verifiedCount: 4,
      badges: ['Spotter', 'Civic Guard', 'City Hero'],
    });

    const citizenSunita = await User.create({
      name: 'Sunita Rao',
      email: 'sunita@civicpulse.org',
      password: 'password123',
      role: 'Citizen',
      points: 120,
      level: 3,
      reportedCount: 2,
      verifiedCount: 6,
      badges: ['Spotter', 'Trustworthy Verifier'],
    });

    const citizenRahul = await User.create({
      name: 'Rahul Verma',
      email: 'rahul@civicpulse.org',
      password: 'password123',
      role: 'Citizen',
      points: 80,
      level: 2,
      reportedCount: 1,
      verifiedCount: 2,
      badges: ['Spotter'],
    });

    const citizenKaran = await User.create({
      name: 'Karan Malhotra',
      email: 'karan@civicpulse.org',
      password: 'password123',
      role: 'Citizen',
      points: 40,
      level: 1,
      reportedCount: 0,
      verifiedCount: 2,
      badges: [],
    });
    console.log('Created Citizens.');

    // 4. Create Issues
    // A. Reported Status (Newly reported, no votes)
    const issue1 = await Issue.create({
      reporter: citizenAmit._id,
      title: 'Flickering Streetlight near Park',
      description: 'The streetlamp at the corner of Sector-3 park is blinking continuously, making it dark and unsafe for walkers.',
      category: 'Damaged Streetlights',
      image: '/uploads/streetlight.jpg',
      latitude: 12.9304,
      longitude: 77.5834,
      severity: 'Medium',
      safetySuggestions: 'Walk on the opposite side where shops have emergency lighting, avoid walking late alone.',
      status: 'Reported',
    });

    // B. Verified Status (Consensus reached, ready for assignment or auto-assigned but pending staff acceptance/start)
    const issue2 = await Issue.create({
      reporter: citizenSunita._id,
      title: 'Major Pipeline Leakage',
      description: 'Drinking water is bursting out of a main joint pipe, wasting thousands of gallons and flooding the pathway.',
      category: 'Water Leakage',
      image: '/uploads/water-leak.jpg',
      latitude: 12.9592,
      longitude: 77.5714,
      severity: 'High',
      safetySuggestions: 'Do not attempt to block the water pressure. Pedestrians should watch for slippery moss on paving.',
      status: 'Verified',
      upvotes: [citizenAmit._id, citizenRahul._id, citizenKaran._id],
      assignedStaff: staffPlumbing._id,
      cost: 3000,
    });

    // C. In Progress Status (Staff working on it)
    const issue3 = await Issue.create({
      reporter: citizenRahul._id,
      title: 'Deep Potholes on MG Road Lane',
      description: 'Three consecutive deep potholes are causing two-wheelers to slip, especially during night hours.',
      category: 'Potholes & Roads',
      image: '/uploads/pothole-original.jpg',
      latitude: 12.9756,
      longitude: 77.5978,
      severity: 'Critical',
      safetySuggestions: 'Slow down significantly, do not tail close to larger cars which block pothole visibility.',
      status: 'In Progress',
      upvotes: [citizenAmit._id, citizenSunita._id, citizenKaran._id],
      assignedStaff: staffRoads._id,
      checkInVerified: true,
      cost: 5000,
    });

    // D. Completed Status (Staff completed fix, pending Admin AI Audit)
    const issue4 = await Issue.create({
      reporter: citizenAmit._id,
      title: 'Garbage Dump Accumulation',
      description: 'Industrial and domestic plastic wastes are piled high next to the Jayanagar school gate.',
      category: 'Waste Management',
      image: '/uploads/garbage-original.jpg',
      latitude: 12.9348,
      longitude: 77.6189,
      severity: 'High',
      safetySuggestions: 'Do not approach the dump; stray dogs and vectors are gathering nearby. Advise children to cover faces.',
      status: 'Completed',
      upvotes: [citizenSunita._id, citizenRahul._id, citizenKaran._id],
      assignedStaff: staffSanitation._id,
      checkInVerified: true,
      resolutionImage: '/uploads/garbage-fixed.jpg',
      cost: 1500,
    });

    // E. Resolved Status (Admin audited and resolved)
    const issue5 = await Issue.create({
      reporter: citizenSunita._id,
      title: 'Damaged Pothole in Indiranagar',
      description: 'A huge road depression is blocking the left turn lane near the metro station.',
      category: 'Potholes & Roads',
      image: '/uploads/pothole-original.jpg',
      latitude: 12.9718,
      longitude: 77.6412,
      severity: 'Critical',
      safetySuggestions: 'Utilize detour route through 80 Feet Road.',
      status: 'Resolved',
      upvotes: [citizenAmit._id, citizenRahul._id, citizenKaran._id],
      assignedStaff: staffRoads._id,
      checkInVerified: true,
      resolutionImage: '/uploads/pothole-fixed.jpg',
      cost: 5000,
      aiResolutionConfidence: 96,
      aiResolutionDetails: 'Gemini AI Auditor confirmed: The comparison images prove that the road asphalt has been successfully patched and smoothed.',
      resolvedBy: adminUser._id,
      resolvedAt: new Date(Date.now() - 3600000), // 1 hour ago
    });
    console.log('Created Seeding Issues.');

    // 5. Seed Activities
    await Activity.create([
      {
        user: citizenAmit._id,
        text: 'Amit Patel reported a new issue: "Flickering Streetlight near Park" (+10 XP)',
        type: 'report',
      },
      {
        user: citizenSunita._id,
        text: 'Sunita Rao reported a new issue: "Major Pipeline Leakage" (+10 XP)',
        type: 'report',
      },
      {
        user: citizenAmit._id,
        text: 'Amit Patel verified the report "Major Pipeline Leakage" (+2 XP)',
        type: 'upvote',
      },
      {
        user: citizenRahul._id,
        text: 'Rahul Verma verified the report "Major Pipeline Leakage" (+2 XP)',
        type: 'upvote',
      },
      {
        user: citizenKaran._id,
        text: 'Karan Malhotra verified the report "Major Pipeline Leakage" (+2 XP)',
        type: 'upvote',
      },
      {
        text: 'Community consensus reached for "Major Pipeline Leakage". Status promoted to VERIFIED.',
        type: 'system',
      },
      {
        user: staffPlumbing._id,
        text: 'System auto-routed and assigned Manoj Gowda to resolve "Major Pipeline Leakage". Status set to IN PROGRESS.',
        type: 'assign',
      },
      {
        user: staffSanitation._id,
        text: 'Staff member Rajesh Kumar checked-in at location for "Garbage Dump Accumulation"',
        type: 'assign',
      },
      {
        user: staffSanitation._id,
        text: 'Staff Rajesh Kumar completed work on "Garbage Dump Accumulation". Pending Admin Audit.',
        type: 'assign',
      },
      {
        user: adminUser._id,
        text: 'Municipal Admin officially verified and resolved "Damaged Pothole in Indiranagar" via Gemini Audit (+50 XP to reporter, +20 XP to staff)',
        type: 'resolve',
      },
    ]);
    console.log('Seeded Activities Logs.');

    console.log('Database Seeding Successful! Exiting...');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedDB();
