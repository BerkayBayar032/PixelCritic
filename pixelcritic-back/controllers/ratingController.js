const Rating = require('../models/Rating');

// @desc    Rate a game (create or update)
// @route   POST /api/ratings
const rateGame = async (req, res) => {
  const { gameId, score, platform } = req.body;

  if (!gameId || !score || !platform) {
    return res.status(400).json({ message: 'Please provide gameId, score, and platform' });
  }

  const rating = await Rating.findOneAndUpdate(
    { user: req.user._id, game: gameId },
    { score, platform },
    { new: true, upsert: true, runValidators: true }
  );

  res.status(201).json(rating);
};

// @desc    Get current user's rating for a game
// @route   GET /api/ratings/game/:gameId/me
const getMyRating = async (req, res) => {
  const rating = await Rating.findOne({
    user: req.user._id,
    game: req.params.gameId,
  });

  res.json(rating);
};

// @desc    Get all ratings by a user
// @route   GET /api/ratings/user/:userId
const getRatingsByUser = async (req, res) => {
  const ratings = await Rating.find({ user: req.params.userId })
    .populate('game', 'title coverImage averageScore')
    .sort({ createdAt: -1 });

  res.json(ratings);
};

// @desc    Get all ratings for a game
// @route   GET /api/ratings/game/:gameId
const getRatingsByGame = async (req, res) => {
  const ratings = await Rating.find({ game: req.params.gameId })
    .populate('user', 'username avatar')
    .sort({ createdAt: -1 });

  res.json(ratings);
};

// @desc    Delete user's rating for a game
// @route   DELETE /api/ratings/game/:gameId
const deleteMyRating = async (req, res) => {
  const rating = await Rating.findOneAndDelete({
    user: req.user._id,
    game: req.params.gameId,
  });

  if (!rating) {
    return res.status(404).json({ message: 'Rating not found' });
  }

  res.json({ message: 'Rating removed' });
};

module.exports = {
  rateGame,
  getMyRating,
  getRatingsByUser,
  getRatingsByGame,
  deleteMyRating,
};
