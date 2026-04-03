require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Game = require('../models/Game');
const { fetchAllRatedGames, fetchNewReleases } = require('../services/igdb');

async function seed() {
  await connectDB();

  console.log('Fetching ALL rated games from IGDB (this may take a few minutes)...');
  const ratedGames = await fetchAllRatedGames(1);
  console.log(`  Fetched ${ratedGames.length} rated games`);

  console.log('Fetching new releases from IGDB...');
  const newReleases = await fetchNewReleases(500);
  console.log(`  Fetched ${newReleases.length} new releases`);

  // Merge and deduplicate by igdbId
  const allGames = [...ratedGames, ...newReleases];
  const seen = new Set();
  const unique = allGames.filter((g) => {
    if (seen.has(g.igdbId)) return false;
    seen.add(g.igdbId);
    return true;
  });

  console.log(`Seeding ${unique.length} unique games into MongoDB...`);

  let upserted = 0;
  for (const game of unique) {
    await Game.findOneAndUpdate({ igdbId: game.igdbId }, game, {
      upsert: true,
      new: true,
    });
    upserted++;
    if (upserted % 100 === 0) {
      console.log(`  Upserted ${upserted}/${unique.length}...`);
    }
  }

  console.log(`Seeded ${upserted} games successfully.`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
