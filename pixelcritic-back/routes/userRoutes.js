const express = require('express');
const router = express.Router();
const { getUserProfile, updateProfile, searchUsers } = require('../controllers/userController');
const { protect } = require('../middlewares/auth');

router.get('/search', searchUsers);
router.put('/me', protect, updateProfile);
router.get('/:username', getUserProfile);

module.exports = router;
