const Game = require('../models/Game');
const Library = require('../models/Library');
const Review = require('../models/Review');
const Rating = require('../models/Rating');

// @desc    Get all games with filtering, sorting, search, pagination
// @route   GET /api/games
const getGames = async (req, res) => {
  const {
    genre, theme, platform, developer, publisher,
    minScore, maxScore, sort, search, collection,
    page = 1, limit = 20,
  } = req.query;

  const filter = {};

  if (genre) filter.genres = { $in: Array.isArray(genre) ? genre : [genre] };
  if (theme) filter.themes = { $in: Array.isArray(theme) ? theme : [theme] };
  if (platform) filter['platforms.name'] = { $in: Array.isArray(platform) ? platform : [platform] };
  if (developer) filter.developer = { $in: Array.isArray(developer) ? developer : [developer] };
  if (publisher) filter.publisher = { $in: Array.isArray(publisher) ? publisher : [publisher] };

  if (minScore || maxScore) {
    filter.averageScore = {};
    if (minScore) filter.averageScore.$gte = parseFloat(minScore);
    if (maxScore) filter.averageScore.$lte = parseFloat(maxScore);
  }

  if (search) {
    filter.$text = { $search: search };
  }

  // Collection filters
  if (collection === 'Newly Released') {
    const currentYear = new Date().getFullYear();
    filter.releaseYear = { $gte: currentYear - 1 };
  }
  if (collection === 'Trending Games') {
    // Get game IDs with recent activity (last 7 days)
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [libActivity, revActivity, ratActivity] = await Promise.all([
      Library.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: '$game' } }]),
      Review.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: '$game' } }]),
      Rating.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: '$game' } }]),
    ]);
    const trendingIds = new Set([
      ...libActivity.map(a => a._id?.toString()),
      ...revActivity.map(a => a._id?.toString()),
      ...ratActivity.map(a => a._id?.toString()),
    ].filter(Boolean));
    if (trendingIds.size > 0) {
      filter._id = { $in: [...trendingIds] };
    } else {
      // No recent activity — fall back to high-rated
      filter.averageScore = { ...filter.averageScore, $gte: 7 };
    }
  }

  // Sorting
  let sortOption = { averageScore: -1 }; // default
  if (sort === 'score_asc') sortOption = { averageScore: 1 };
  if (sort === 'score_desc') sortOption = { averageScore: -1 };
  if (sort === 'release_desc') sortOption = { releaseYear: -1 };
  if (sort === 'release_asc') sortOption = { releaseYear: 1 };
  if (sort === 'title_asc') sortOption = { title: 1 };
  if (sort === 'title_desc') sortOption = { title: -1 };

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const [data, total] = await Promise.all([
    Game.find(filter).sort(sortOption).skip(skip).limit(limitNum),
    Game.countDocuments(filter),
  ]);

  res.json({
    data,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
    total,
  });
};

// @desc    Get single game by ID
// @route   GET /api/games/:id
const getGameById = async (req, res) => {
  const game = await Game.findById(req.params.id);

  if (!game) {
    return res.status(404).json({ message: 'Game not found' });
  }

  res.json(game);
};

// @desc    Get trending games based on recent activity (last 7 days)
// @route   GET /api/games/trending
const getTrendingGames = async (req, res) => {
  const limit = parseInt(req.query.limit) || 6;
  const days = parseInt(req.query.days) || 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Count recent activity per game in parallel
  const [recentLibrary, recentReviews, recentRatings] = await Promise.all([
    Library.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$game', count: { $sum: 1 } } },
    ]),
    Review.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$game', count: { $sum: 1 } } },
    ]),
    Rating.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$game', count: { $sum: 1 } } },
    ]),
  ]);

  // Build a trending score map: library adds (1pt) + reviews (3pts) + ratings (2pts)
  const scoreMap = new Map();

  for (const { _id, count } of recentLibrary) {
    if (_id) scoreMap.set(_id.toString(), (scoreMap.get(_id.toString()) || 0) + count * 1);
  }
  for (const { _id, count } of recentReviews) {
    if (_id) scoreMap.set(_id.toString(), (scoreMap.get(_id.toString()) || 0) + count * 3);
  }
  for (const { _id, count } of recentRatings) {
    if (_id) scoreMap.set(_id.toString(), (scoreMap.get(_id.toString()) || 0) + count * 2);
  }

  if (scoreMap.size === 0) {
    // No recent activity — fall back to highest-rated games
    const games = await Game.find({ averageScore: { $gt: 0 } })
      .sort({ averageScore: -1 })
      .limit(limit);
    return res.json(games);
  }

  // Sort by trending score, take top N game IDs
  const sorted = [...scoreMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  // Fetch the game documents and preserve trending order
  const games = await Game.find({ _id: { $in: sorted } });
  const gameMap = new Map(games.map(g => [g._id.toString(), g]));
  const ordered = sorted.map(id => gameMap.get(id)).filter(Boolean);

  res.json(ordered);
};

// @desc    Get new releases
// @route   GET /api/games/new-releases
const getNewReleases = async (req, res) => {
  const limit = parseInt(req.query.limit) || 6;

  const games = await Game.find({ releaseYear: { $exists: true } })
    .sort({ releaseYear: -1 })
    .limit(limit);

  res.json(games);
};

// @desc    Get games by genre
// @route   GET /api/games/genre/:genre
const getGamesByGenre = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  const escaped = req.params.genre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const games = await Game.find({ genres: { $regex: new RegExp(escaped, 'i') } })
    .sort({ averageScore: -1 })
    .limit(limit);

  res.json(games);
};

// @desc    Search games
// @route   GET /api/games/search
const searchGames = async (req, res) => {
  const { q, limit = 10 } = req.query;

  if (!q) {
    return res.json([]);
  }

  const games = await Game.find({
    title: { $regex: q, $options: 'i' },
  })
    .select('title coverImage averageScore')
    .limit(parseInt(limit));

  res.json(games);
};

module.exports = {
  getGames,
  getGameById,
  getTrendingGames,
  getNewReleases,
  getGamesByGenre,
  searchGames,
};
