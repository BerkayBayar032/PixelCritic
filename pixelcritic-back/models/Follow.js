const mongoose = require('mongoose');

const followSchema = new mongoose.Schema(
  {
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// One follow relationship per pair
followSchema.index({ follower: 1, following: 1 }, { unique: true });

// Prevent self-follows
followSchema.pre('validate', function () {
  if (this.follower.equals(this.following)) {
    throw new Error('Users cannot follow themselves');
  }
});

module.exports = mongoose.model('Follow', followSchema);
