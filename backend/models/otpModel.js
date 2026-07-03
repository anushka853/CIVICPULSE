import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    otp: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['verification', 'reset'],
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600, // Expires and self-deletes after 10 minutes (600 seconds)
    },
  }
);

const Otp = mongoose.model('Otp', otpSchema);

export default Otp;
