const Library = require('../models/Library');
const Game = require('../models/Game');

// @desc    Get user's library
// @route   GET /api/library/:userId
const getLibrary = async (req, res) => {
  const { status } = req.query;
  const filter = { user: req.params.userId };
  if (status) filter.status = status;

  const entries = await Library.find(filter)
    .populate('game', 'title coverImage averageScore developer releaseYear genres platforms')
    .sort({ updatedAt: -1 });

  // Filter out orphaned entries (game was deleted/reseeded) and clean them up
  const validEntries = [];
  const orphanIds = [];
  for (const entry of entries) {
    if (entry.game != null) {
      validEntries.push(entry);
    } else {
      orphanIds.push(entry._id);
    }
  }

  // Clean up orphans in the background (don't block response)
  if (orphanIds.length > 0) {
    Library.deleteMany({ _id: { $in: orphanIds } }).catch(err =>
      console.error('Failed to clean orphaned library entries:', err.message)
    );
  }

  res.json(validEntries);
};

// @desc    Get library entry for a specific game (current user)
// @route   GET /api/library/game/:gameId
const getLibraryEntry = async (req, res) => {
  const entry = await Library.findOne({
    user: req.user._id,
    game: req.params.gameId,
  });

  if (entry) {
    // Verify the referenced game still exists
    const gameExists = await Game.exists({ _id: req.params.gameId });
    if (!gameExists) {
      // Orphaned entry — delete it and return null
      await entry.deleteOne();
      return res.json(null);
    }
  }

  res.json(entry);
};

// @desc    Add game to library
// @route   POST /api/library
const addToLibrary = async (req, res) => {
  const { gameId, status } = req.body;

  if (!gameId || !status) {
    return res.status(400).json({ message: 'Please provide gameId and status' });
  }

  // Upsert: create or update
  const entry = await Library.findOneAndUpdate(
    { user: req.user._id, game: gameId },
    { status },
    { new: true, upsert: true, runValidators: true }
  ).populate('game', 'title coverImage averageScore');

  res.status(201).json(entry);
};

// @desc    Update library entry status
// @route   PUT /api/library/:id
const updateLibraryEntry = async (req, res) => {
  const { status } = req.body;

  const entry = await Library.findById(req.params.id);
  if (!entry) {
    return res.status(404).json({ message: 'Library entry not found' });
  }

  if (entry.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  entry.status = status;
  await entry.save();

  res.json(entry);
};

// @desc    Remove game from library
// @route   DELETE /api/library/:id
const removeFromLibrary = async (req, res) => {
  const entry = await Library.findById(req.params.id);
  if (!entry) {
    return res.status(404).json({ message: 'Library entry not found' });
  }

  if (entry.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  await entry.deleteOne();
  res.json({ message: 'Removed from library' });
};

// @desc    Remove game from library by gameId (current user)
// @route   DELETE /api/library/game/:gameId
const removeByGameId = async (req, res) => {
  // Delete any library entry for this game (including orphans)
  // Use deleteMany to also clean up potential duplicates
  await Library.deleteMany({
    user: req.user._id,
    game: req.params.gameId,
  });

  res.json({ message: 'Removed from library' });
};

module.exports = {
  getLibrary,
  getLibraryEntry,
  addToLibrary,
  updateLibraryEntry,
  removeFromLibrary,
  removeByGameId,
};
