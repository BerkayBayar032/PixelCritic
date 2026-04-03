const express = require('express');
const router = express.Router();
const { followUser, unfollowUser, checkFollow, getFollowers, getFollowing, removeFollower } = require('../controllers/followController');
const { protect } = require('../middlewares/auth');

router.post('/:userId', protect, followUser);
router.delete('/:userId', protect, unfollowUser);
router.get('/:userId/check', protect, checkFollow);
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);
router.delete('/:userId/remove-follower', protect, removeFollower);

module.exports = router;
