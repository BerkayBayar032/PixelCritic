const Review = require('../models/Review');
const Vote = require('../models/Vote');
const Game = require('../models/Game');

// @desc    Get reviews for a game
// @route   GET /api/reviews/game/:gameId
const getReviewsByGame = async (req, res) => {
  const { platform, sort = 'newest', page = 1, limit = 20 } = req.query;

  const filter = { game: req.params.gameId };
  if (platform) filter.platform = platform;

  let sortOption = { createdAt: -1 };
  if (sort === 'oldest') sortOption = { createdAt: 1 };
  if (sort === 'most_liked') sortOption = { upvotes: -1 };
  if (sort === 'most_disliked') sortOption = { downvotes: -1 };

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  const [data, total] = await Promise.all([
    Review.find(filter)
      .populate('author', 'username avatar')
      .sort(sortOption)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Review.countDocuments(filter),
  ]);

  res.json({
    data,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
    total,
  });
};

// @desc    Get reviews by a user
// @route   GET /api/reviews/user/:userId
const getReviewsByUser = async (req, res) => {
  const reviews = await Review.find({ author: req.params.userId })
    .populate('game', 'title coverImage averageScore')
    .sort({ createdAt: -1 });

  res.json(reviews);
};

// @desc    Create a review
// @route   POST /api/reviews
const createReview = async (req, res) => {
  const { gameId, content, rating, platform } = req.body;

  if (!gameId || !content || !platform) {
    return res.status(400).json({ message: 'Please provide gameId, content, and platform' });
  }

  const game = await Game.findById(gameId);
  if (!game) {
    return res.status(404).json({ message: 'Game not found' });
  }

  const review = await Review.create({
    author: req.user._id,
    game: gameId,
    content,
    rating,
    platform,
  });

  const populated = await Review.findById(review._id).populate('author', 'username avatar');

  res.status(201).json(populated);
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
const deleteReview = async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({ message: 'Review not found' });
  }

  if (review.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized to delete this review' });
  }

  // Delete associated votes
  await Vote.deleteMany({ review: review._id });
  await review.deleteOne();

  res.json({ message: 'Review deleted' });
};

// @desc    Vote on a review (upvote/downvote toggle)
// @route   POST /api/reviews/:id/vote
const voteOnReview = async (req, res) => {
  const { type } = req.body; // 'upvote' or 'downvote'

  if (!type || !['upvote', 'downvote'].includes(type)) {
    return res.status(400).json({ message: 'Please provide a valid vote type (upvote or downvote)' });
  }

  const review = await Review.findById(req.params.id);
  if (!review) {
    return res.status(404).json({ message: 'Review not found' });
  }

  const existingVote = await Vote.findOne({
    user: req.user._id,
    review: review._id,
  });

  if (existingVote) {
    if (existingVote.type === type) {
      // Same vote type — remove vote (toggle off)
      if (type === 'upvote') review.upvotes = Math.max(0, review.upvotes - 1);
      else review.downvotes = Math.max(0, review.downvotes - 1);
      await existingVote.deleteOne();
    } else {
      // Different vote type — switch
      if (type === 'upvote') {
        review.upvotes += 1;
        review.downvotes = Math.max(0, review.downvotes - 1);
      } else {
        review.downvotes += 1;
        review.upvotes = Math.max(0, review.upvotes - 1);
      }
      existingVote.type = type;
      await existingVote.save();
    }
  } else {
    // New vote
    await Vote.create({ user: req.user._id, review: review._id, type });
    if (type === 'upvote') review.upvotes += 1;
    else review.downvotes += 1;
  }

  await review.save();

  res.json({
    upvotes: review.upvotes,
    downvotes: review.downvotes,
  });
};

// @desc    Get user's votes for reviews of a game
// @route   GET /api/reviews/game/:gameId/my-votes
const getMyVotes = async (req, res) => {
  const reviews = await Review.find({ game: req.params.gameId }).select('_id');
  const reviewIds = reviews.map((r) => r._id);

  const votes = await Vote.find({
    user: req.user._id,
    review: { $in: reviewIds },
  });

  const voteMap = {};
  votes.forEach((v) => {
    voteMap[v.review.toString()] = v.type;
  });

  res.json(voteMap);
};

module.exports = {
  getReviewsByGame,
  getReviewsByUser,
  createReview,
  deleteReview,
  voteOnReview,
  getMyVotes,
};
