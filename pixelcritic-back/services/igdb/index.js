const { transformGame } = require('./gameTransformer');
const {
  fetchPopularGames,
  fetchNewReleases,
  fetchGamesByGenre,
  fetchGameById,
  searchGames,
  fetchAllRatedGames,
} = require('./gameFetcher');

module.exports = {
  transformGame,
  fetchPopularGames,
  fetchNewReleases,
  fetchGamesByGenre,
  fetchGameById,
  searchGames,
  fetchAllRatedGames,
};
