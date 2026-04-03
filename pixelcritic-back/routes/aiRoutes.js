const express = require('express');
const router = express.Router();
const { getAIRecommendations, getAIGameAnalysis, generateAvatars } = require('../controllers/aiController');
const { protect } = require('../middlewares/auth');

router.get('/recommendations', protect, getAIRecommendations);
router.get('/game-analysis/:gameId', getAIGameAnalysis);
router.post('/generate-avatars', protect, generateAvatars);

module.exports = router;
