/**
 * Transforms an IGDB game object into PixelCritic's format.
 *
 * IGDB fields expected (via Apicalypse expand):
 *   name, first_release_date, total_rating, aggregated_rating,
 *   cover.url, genres[].name, themes[].name, platforms[].name,
 *   involved_companies[].{ company.name, developer, publisher }
 */
function transformGame(igdbGame) {
  const companies = igdbGame.involved_companies || [];

  const developerEntry = companies.find((ic) => ic.developer === true);
  const developer = developerEntry?.company?.name || 'Unknown Developer';

  const publisherEntry = companies.find((ic) => ic.publisher === true);
  const publisher = publisherEntry?.company?.name || 'Unknown Publisher';

  const genres = (igdbGame.genres || []).map((g) => g.name);
  const themes = (igdbGame.themes || []).map((t) => t.name);

  // IGDB scores are 0-100, PixelCritic uses 0-10
  const rawScore = igdbGame.total_rating || igdbGame.aggregated_rating || 0;
  const normalizedScore = parseFloat((rawScore / 10).toFixed(1));

  const platforms = (igdbGame.platforms || []).map((p) => ({
    name: p.name,
    score: normalizedScore,
  }));

  const releaseYear = igdbGame.first_release_date
    ? new Date(igdbGame.first_release_date * 1000).getFullYear()
    : null;

  let coverImage = null;
  if (igdbGame.cover?.url) {
    coverImage = igdbGame.cover.url
      .replace('t_thumb', 't_cover_big')
      .replace(/^\/\//, 'https://');
  }

  return {
    igdbId: igdbGame.id,
    title: igdbGame.name,
    developer,
    publisher,
    genres,
    themes,
    platforms,
    averageScore: normalizedScore,
    releaseYear,
    coverImage,
  };
}

module.exports = { transformGame };
