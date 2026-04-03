const express = require('express');
const router = express.Router();
const {
  rateGame,
  getMyRating,
  getRatingsByUser,
  getRatingsByGame,
  deleteMyRating,
} = require('../controllers/ratingController');
const { protect } = require('../middlewares/auth');

router.post('/', protect, rateGame);
router.get('/game/:gameId/me', protect, getMyRating);
router.get('/game/:gameId', getRatingsByGame);
router.get('/user/:userId', getRatingsByUser);
router.delete('/game/:gameId', protect, deleteMyRating);

module.exports = router;
