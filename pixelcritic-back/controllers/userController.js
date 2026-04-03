const User = require('../models/User');
const Follow = require('../models/Follow');
const Library = require('../models/Library');
const Review = require('../models/Review');
const Rating = require('../models/Rating');

// @desc    Get user profile by username
// @route   GET /api/users/:username
const getUserProfile = async (req, res) => {
  const user = await User.findOne({ username: req.params.username });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const [totalGames, totalReviews, totalRatings, followers, following] = await Promise.all([
    Library.countDocuments({ user: user._id }),
    Review.countDocuments({ author: user._id }),
    Rating.countDocuments({ user: user._id }),
    Follow.countDocuments({ following: user._id }),
    Follow.countDocuments({ follower: user._id }),
  ]);

  res.json({
    _id: user._id,
    username: user.username,
    avatar: user.avatar,
    bio: user.bio,
    createdAt: user.createdAt,
    stats: { totalGames, totalReviews, totalRatings },
    followers,
    following,
  });
};

// @desc    Update user profile (bio, avatar)
// @route   PUT /api/users/me
const updateProfile = async (req, res) => {
  const { bio, avatar } = req.body;
  const updates = {};
  if (bio !== undefined) updates.bio = bio;
  if (avatar !== undefined) updates.avatar = avatar;

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.json({
    _id: user._id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    bio: user.bio,
  });
};

// @desc    Search users by username
// @route   GET /api/users/search?q=term
const searchUsers = async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) {
    return res.json([]);
  }

  const users = await User.find({
    username: { $regex: q, $options: 'i' },
  })
    .select('username avatar')
    .limit(10);

  res.json(users);
};

module.exports = { getUserProfile, updateProfile, searchUsers };
