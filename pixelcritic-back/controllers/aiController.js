const { getRecommendations, getGameAnalysis, generateAvatarImages } = require('../services/gemini');
const Library = require('../models/Library');
const Review = require('../models/Review');
const Game = require('../models/Game');

// @desc    Get AI recommendations for current user
// @route   GET /api/ai/recommendations
const getAIRecommendations = async (req, res) => {
  try {
    const [libraryEntries, reviews] = await Promise.all([
      Library.find({ user: req.user._id })
        .populate('game', 'title genres themes developer')
        .limit(20),
      Review.find({ author: req.user._id })
        .populate('game', 'title genres')
        .limit(10),
    ]);

    // Filter out entries where the game was deleted or populate failed
    const validLibrary = libraryEntries.filter(e => e.game != null);
    const validReviews = reviews.filter(r => r.game != null);

    if (validLibrary.length === 0 && validReviews.length === 0) {
      return res.json({
        recommendations: [],
        message: 'Add games to your library or write reviews to get personalized recommendations!',
      });
    }

    const recommendations = await getRecommendations(validLibrary, validReviews);

    // Try to match recommended titles with games in our DB
    const enriched = await Promise.all(
      recommendations.map(async (rec) => {
        const game = await Game.findOne({
          title: { $regex: new RegExp(`^${rec.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        }).select('_id title coverImage averageScore genres developer');

        return {
          ...rec,
          game: game || null,
        };
      })
    );

    res.json({ recommendations: enriched });
  } catch (err) {
    console.error('AI Recommendations error:', err.message, err.stack);
    res.json({
      recommendations: [],
      message: 'AI recommendations are currently unavailable. Please try again later.',
    });
  }
};

// @desc    Get AI analysis of a game's reviews
// @route   GET /api/ai/game-analysis/:gameId
const getAIGameAnalysis = async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId).select('title');
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    const reviews = await Review.find({ game: req.params.gameId })
      .select('content rating')
      .limit(20);

    if (reviews.length === 0) {
      return res.json({
        analysis: null,
        message: 'No reviews yet to analyze.',
      });
    }

    const analysis = await getGameAnalysis(game.title, reviews);
    res.json({ analysis });
  } catch (err) {
    console.error('AI Game Analysis error:', err.message);
    res.json({
      analysis: null,
      message: 'AI analysis is currently unavailable.',
    });
  }
};

// @desc    Generate AI avatar configurations
// @route   POST /api/ai/generate-avatars
const generateAvatars = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ message: 'Please provide a prompt' });
    }

    const avatars = await generateAvatarImages(prompt.trim());
    res.json({ avatars });
  } catch (err) {
    console.error('AI Avatar Generation error:', err.message);
    res.json({
      avatars: null,
      message: 'AI avatar generation is currently unavailable. Please try again later.',
    });
  }
};

module.exports = { getAIRecommendations, getAIGameAnalysis, generateAvatars };
