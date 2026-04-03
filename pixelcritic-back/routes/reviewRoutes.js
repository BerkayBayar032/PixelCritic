const express = require('express');
const router = express.Router();
const {
  getReviewsByGame,
  getReviewsByUser,
  createReview,
  deleteReview,
  voteOnReview,
  getMyVotes,
} = require('../controllers/reviewController');
const { protect } = require('../middlewares/auth');

router.get('/game/:gameId', getReviewsByGame);
router.get('/game/:gameId/my-votes', protect, getMyVotes);
router.get('/user/:userId', getReviewsByUser);
router.post('/', protect, createReview);
router.delete('/:id', protect, deleteReview);
router.post('/:id/vote', protect, voteOnReview);

module.exports = router;
