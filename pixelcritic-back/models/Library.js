const mongoose = require('mongoose');

const librarySchema = new mongoose.Schema(
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
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['Played', 'Playing', 'Plan to Play', 'Dropped'],
        message: '{VALUE} is not a valid status',
      },
    },
  },
  { timestamps: true }
);

// One library entry per user per game
librarySchema.index({ user: 1, game: 1 }, { unique: true });

module.exports = mongoose.model('Library', librarySchema);
