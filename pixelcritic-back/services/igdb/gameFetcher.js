const { igdbRequest } = require('./igdbClient');
const { transformGame } = require('./gameTransformer');

// Shared field list for all game queries
const GAME_FIELDS = `
  fields name, first_release_date, total_rating, aggregated_rating,
    cover.url, genres.name, themes.name, platforms.name,
    involved_companies.company.name, involved_companies.developer,
    involved_companies.publisher;
`.trim();

async function fetchPopularGames(limit = 50) {
  const query = `
    ${GAME_FIELDS}
    where total_rating != null & total_rating > 70 & cover != null;
    sort total_rating desc;
    limit ${limit};
  `.trim();

  const games = await igdbRequest('games', query);
  return games.map(transformGame);
}

async function fetchNewReleases(limit = 20) {
  const now = Math.floor(Date.now() / 1000);
  const sixMonthsAgo = now - (180 * 24 * 60 * 60);

  const query = `
    ${GAME_FIELDS}
    where first_release_date > ${sixMonthsAgo} & first_release_date < ${now} & cover != null;
    sort first_release_date desc;
    limit ${limit};
  `.trim();

  const games = await igdbRequest('games', query);
  return games.map(transformGame);
}

async function fetchGamesByGenre(genreName, limit = 20) {
  const query = `
    ${GAME_FIELDS}
    where genres.name = "${genreName}" & total_rating != null & cover != null;
    sort total_rating desc;
    limit ${limit};
  `.trim();

  const games = await igdbRequest('games', query);
  return games.map(transformGame);
}

async function fetchGameById(igdbId) {
  const query = `
    ${GAME_FIELDS}
    where id = ${igdbId};
  `.trim();

  const games = await igdbRequest('games', query);
  return games.length > 0 ? transformGame(games[0]) : null;
}

async function searchGames(searchQuery, limit = 20) {
  const query = `
    search "${searchQuery}";
    ${GAME_FIELDS}
    where cover != null;
    limit ${limit};
  `.trim();

  const games = await igdbRequest('games', query);
  return games.map(transformGame);
}

/**
 * Fetch ALL rated games from IGDB with pagination.
 * IGDB max per request is 500. We paginate with offset until no more results.
 * Fetches games that have a rating and a cover image.
 */
async function fetchAllRatedGames(minRating = 1) {
  const allGames = [];
  let offset = 0;
  const batchSize = 500;

  while (true) {
    const query = `
      ${GAME_FIELDS}
      where total_rating != null & total_rating >= ${minRating} & cover != null;
      sort total_rating desc;
      limit ${batchSize};
      offset ${offset};
    `.trim();

    const batch = await igdbRequest('games', query);
    if (!batch || batch.length === 0) break;

    allGames.push(...batch.map(transformGame));
    console.log(`  Fetched ${allGames.length} games so far (offset ${offset})...`);

    if (batch.length < batchSize) break; // last page
    offset += batchSize;
  }

  return allGames;
}

module.exports = {
  fetchPopularGames,
  fetchNewReleases,
  fetchGamesByGenre,
  fetchGameById,
  searchGames,
  fetchAllRatedGames,
};
