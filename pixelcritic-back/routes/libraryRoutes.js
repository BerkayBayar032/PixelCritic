const express = require('express');
const router = express.Router();
const {
  getLibrary,
  getLibraryEntry,
  addToLibrary,
  updateLibraryEntry,
  removeFromLibrary,
  removeByGameId,
} = require('../controllers/libraryController');
const { protect } = require('../middlewares/auth');

router.get('/game/:gameId', protect, getLibraryEntry);
router.delete('/game/:gameId', protect, removeByGameId);
router.get('/:userId', getLibrary);
router.post('/', protect, addToLibrary);
router.put('/:id', protect, updateLibraryEntry);
router.delete('/:id', protect, removeFromLibrary);

module.exports = router;
