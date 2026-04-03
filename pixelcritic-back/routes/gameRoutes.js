const express = require('express');
const router = express.Router();
const {
  getGames,
  getGameById,
  getTrendingGames,
  getNewReleases,
  getGamesByGenre,
  searchGames,
} = require('../controllers/gameController');

router.get('/', getGames);
router.get('/trending', getTrendingGames);
router.get('/new-releases', getNewReleases);
router.get('/search', searchGames);
router.get('/genre/:genre', getGamesByGenre);
router.get('/:id', getGameById);

module.exports = router;
