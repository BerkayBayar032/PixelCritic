const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema(
  {
    igdbId: {
      type: Number,
      unique: true,
      sparse: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Game title is required'],
      trim: true,
    },
    developer: {
      type: String,
      default: 'Unknown Developer',
    },
    publisher: {
      type: String,
      default: 'Unknown Publisher',
    },
    genres: [{ type: String }],
    themes: [{ type: String }],
    platforms: [
      {
        name: { type: String, required: true },
        score: { type: Number, default: 0, min: 0, max: 10 },
      },
    ],
    averageScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
      index: true,
    },
    releaseYear: {
      type: Number,
      index: true,
    },
    coverImage: {
      type: String,
    },
  },
  { timestamps: true }
);

gameSchema.index({ title: 'text', developer: 'text', publisher: 'text' });

module.exports = mongoose.model('Game', gameSchema);
