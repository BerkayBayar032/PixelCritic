const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    review: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: {
        values: ['upvote', 'downvote'],
        message: '{VALUE} is not a valid vote type',
      },
    },
  },
  { timestamps: true }
);

// One vote per user per review
voteSchema.index({ user: 1, review: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);
