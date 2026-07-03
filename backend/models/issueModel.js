import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: [
        'Waste Management',
        'Potholes & Roads',
        'Water Leakage',
        'Damaged Streetlights',
        'Public Infrastructure',
        'Other',
      ],
      required: true,
    },
    image: {
      type: String, // URL/Path to uploaded photo
      required: true,
    },
    images: {
      type: [String],
      default: [],
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
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
    landmark: {
      type: String,
    },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Reported', 'Verified', 'In Progress', 'Completed', 'Resolved'],
      default: 'Reported',
    },
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    checkInVerified: {
      type: Boolean,
      default: false,
    },
    cost: {
      type: Number,
      default: 0,
    },
    isDuplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    downvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    resolutionImage: {
      type: String, // URL/Path to resolution verification image
    },
    aiResolutionConfidence: {
      type: Number, // Percentage of AI confidence in resolution
    },
    aiResolutionResult: {
      type: String,
      enum: ['Cleaned', 'Partially Cleaned', 'Not Cleaned'],
    },
    aiResolutionDetails: {
      type: String, // AI notes on verification comparison
    },
    safetySuggestions: {
      type: String, // Safety guidance from AI for citizens
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for score calculations if needed
issueSchema.virtual('netVerifications').get(function () {
  return this.upvotes.length - this.downvotes.length;
});

const Issue = mongoose.model('Issue', issueSchema);

export default Issue;
