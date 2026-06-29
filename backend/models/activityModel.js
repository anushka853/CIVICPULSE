import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    text: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['report', 'upvote', 'resolve', 'assign', 'merge', 'badge', 'system'],
      default: 'system',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;
