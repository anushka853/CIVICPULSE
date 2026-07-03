import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['Citizen', 'Admin', 'Staff'],
      default: 'Citizen',
    },
    points: {
      type: Number,
      default: 0, // XP points
    },
    level: {
      type: Number,
      default: 1, // User level calculated from XP
    },
    reportedCount: {
      type: Number,
      default: 0,
    },
    verifiedCount: {
      type: Number,
      default: 0,
    },
    badges: {
      type: [String],
      default: [], // Badges like 'Spotter', 'Eco Warrior', etc.
    },
    mobile: {
      type: String,
    },
    state: {
      type: String,
    },
    district: {
      type: String,
    },
    city: {
      type: String,
    },
    village: {
      type: String,
    },
    pinCode: {
      type: String,
    },
    serviceArea: {
      type: String,
    },
    workingRadius: {
      type: Number,
      default: 5,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    googleEmail: {
      type: String,
      lowercase: true,
    },
    googleId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
