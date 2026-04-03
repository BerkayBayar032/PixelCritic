const Follow = require('../models/Follow');
const User = require('../models/User');

// @desc    Follow a user
// @route   POST /api/follows/:userId
const followUser = async (req, res) => {
  const { userId } = req.params;

  if (req.user._id.toString() === userId) {
    return res.status(400).json({ message: 'You cannot follow yourself' });
  }

  const targetUser = await User.findById(userId);
  if (!targetUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  const existing = await Follow.findOne({
    follower: req.user._id,
    following: userId,
  });

  if (existing) {
    return res.status(400).json({ message: 'Already following this user' });
  }

  await Follow.create({ follower: req.user._id, following: userId });

  const followerCount = await Follow.countDocuments({ following: userId });
  res.status(201).json({ following: true, followerCount });
};

// @desc    Unfollow a user
// @route   DELETE /api/follows/:userId
const unfollowUser = async (req, res) => {
  const { userId } = req.params;

  const follow = await Follow.findOneAndDelete({
    follower: req.user._id,
    following: userId,
  });

  if (!follow) {
    return res.status(404).json({ message: 'Not following this user' });
  }

  const followerCount = await Follow.countDocuments({ following: userId });
  res.json({ following: false, followerCount });
};

// @desc    Check if current user follows a user
// @route   GET /api/follows/:userId/check
const checkFollow = async (req, res) => {
  const follow = await Follow.findOne({
    follower: req.user._id,
    following: req.params.userId,
  });

  res.json({ following: !!follow });
};

// @desc    Get followers of a user
// @route   GET /api/follows/:userId/followers
const getFollowers = async (req, res) => {
  const follows = await Follow.find({ following: req.params.userId })
    .populate('follower', 'username avatar')
    .sort({ createdAt: -1 });

  res.json(follows.map(f => f.follower));
};

// @desc    Get users that a user is following
// @route   GET /api/follows/:userId/following
const getFollowing = async (req, res) => {
  const follows = await Follow.find({ follower: req.params.userId })
    .populate('following', 'username avatar')
    .sort({ createdAt: -1 });

  res.json(follows.map(f => f.following));
};

// @desc    Remove a follower from current user's followers
// @route   DELETE /api/follows/:userId/remove-follower
const removeFollower = async (req, res) => {
  const { userId } = req.params;

  const follow = await Follow.findOneAndDelete({
    follower: userId,
    following: req.user._id,
  });

  if (!follow) {
    return res.status(404).json({ message: 'This user is not following you' });
  }

  const followerCount = await Follow.countDocuments({ following: req.user._id });
  res.json({ removed: true, followerCount });
};

module.exports = { followUser, unfollowUser, checkFollow, getFollowers, getFollowing, removeFollower };
