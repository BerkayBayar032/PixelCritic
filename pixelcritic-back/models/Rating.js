const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game',
      required: true,
    },
    score: {
      type: Number,
      required: [true, 'Score is required'],
      min: [1, 'Score must be at least 1'],
      max: [10, 'Score cannot exceed 10'],
    },
    platform: {
      type: String,
      required: [true, 'Platform is required'],
    },
  },
  { timestamps: true }
);

// One rating per user per game
ratingSchema.index({ user: 1, game: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
