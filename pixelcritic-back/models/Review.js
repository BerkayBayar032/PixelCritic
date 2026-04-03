const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Review content is required'],
      minlength: [10, 'Review must be at least 10 characters'],
      maxlength: [5000, 'Review cannot exceed 5000 characters'],
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [10, 'Rating cannot exceed 10'],
      default: null,
    },
    platform: {
      type: String,
      required: [true, 'Platform is required'],
    },
    upvotes: {
      type: Number,
      default: 0,
    },
    downvotes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// One review per user per game
reviewSchema.index({ author: 1, game: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
