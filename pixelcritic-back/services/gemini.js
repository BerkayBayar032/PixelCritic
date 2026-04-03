const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

let genAI = null;
let model = null;

const getModel = () => {
  if (!model) {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      throw new Error('GEMINI_API_KEY is not configured. Please set a valid API key in .env');
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }
  return model;
};

/**
 * Get AI-powered game recommendations based on user's library and reviews
 */
const getRecommendations = async (libraryGames, reviews) => {
  const gemini = getModel();

  const libraryInfo = libraryGames.map(entry => {
    const game = entry.game;
    return `- ${game.title} (${entry.status}, genres: ${game.genres?.join(', ') || 'unknown'})`;
  }).join('\n');

  const reviewInfo = reviews.map(review => {
    const game = review.game;
    return `- ${game?.title || 'Unknown'}: ${review.rating}/10 - "${review.content?.substring(0, 100)}"`;
  }).join('\n');

  const prompt = `You are a gaming recommendation AI for PixelCritic, a gaming social network.

Based on the user's gaming library and reviews, suggest 6 game recommendations. Consider their preferred genres, play patterns, and review sentiments.

User's Library:
${libraryInfo || 'Empty library'}

User's Reviews:
${reviewInfo || 'No reviews yet'}

Respond ONLY with a valid JSON array of exactly 6 objects. Each object must have:
- "title": string (the game name)
- "reason": string (1 sentence explaining why they'd enjoy it, personalized to their taste)
- "matchScore": number (1-100, how well it matches their preferences)

JSON array only, no markdown, no explanation:`;

  try {
    const result = await gemini.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Gemini getRecommendations error:', err.message);
    throw new Error('Failed to generate recommendations from AI');
  }
};

/**
 * Get an AI-generated summary/analysis of a game based on reviews
 */
const getGameAnalysis = async (gameTitle, reviews) => {
  const gemini = getModel();

  const reviewTexts = reviews.map(r =>
    `Rating: ${r.rating}/10 - "${r.content?.substring(0, 200)}"`
  ).join('\n');

  const prompt = `You are a gaming analyst AI for PixelCritic. Analyze the community reviews for "${gameTitle}" and provide a brief, engaging summary.

Community Reviews:
${reviewTexts || 'No reviews yet'}

Respond ONLY with a valid JSON object containing:
- "summary": string (2-3 sentence analysis of community sentiment)
- "pros": string[] (up to 3 key positives mentioned)
- "cons": string[] (up to 3 key negatives mentioned)
- "sentiment": "positive" | "mixed" | "negative"

JSON only, no markdown:`;

  try {
    const result = await gemini.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Gemini getGameAnalysis error:', err.message);
    throw new Error('Failed to generate game analysis from AI');
  }
};

/**
 * Generate AI-powered avatar images using Gemini's native image generation
 */
const generateAvatarImages = async (prompt) => {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  // Use gemini-2.5-flash-image which supports native image generation
  const imageGenAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const imageModel = imageGenAI.getGenerativeModel({
    model: 'gemini-2.5-flash-image',
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
    },
  });

  const styles = [
    { style: 'pixel art, retro 16-bit gaming aesthetic, vibrant colors', label: 'Pixel Art' },
    { style: 'cyberpunk digital art, neon glow effects, futuristic', label: 'Cyberpunk' },
    { style: 'anime cel-shaded illustration, clean lines, colorful', label: 'Anime Style' },
    { style: 'stylized 3D render, modern character design, cinematic lighting', label: '3D Render' },
  ];

  const avatars = [];

  // Generate images in parallel (max 4 at once)
  const results = await Promise.allSettled(
    styles.map(async ({ style, label }, i) => {
      const fullPrompt = `Generate a square profile picture avatar based on this description: "${prompt}".
Art style: ${style}.
Requirements: centered character/subject, simple clean background, suitable as a gaming social network profile picture, square aspect ratio.`;

      const result = await imageModel.generateContent(fullPrompt);
      const parts = result.response.candidates?.[0]?.content?.parts || [];

      for (const part of parts) {
        if (part.inlineData) {
          // Save image to disk instead of returning huge base64 string
          const ext = part.inlineData.mimeType === 'image/png' ? 'png' : 'jpg';
          const filename = `avatar_${Date.now()}_${i}.${ext}`;
          const uploadDir = path.join(__dirname, '..', 'uploads', 'avatars');
          if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
          const filePath = path.join(uploadDir, filename);
          fs.writeFileSync(filePath, Buffer.from(part.inlineData.data, 'base64'));

          return {
            id: `gen${i + 1}`,
            url: `/uploads/avatars/${filename}`,
            label,
          };
        }
      }
      throw new Error('No image data in response');
    })
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      avatars.push(result.value);
    } else {
      console.error('Avatar generation failed for one style:', result.reason?.message);
    }
  }

  if (avatars.length === 0) {
    throw new Error('Failed to generate any avatar images');
  }

  return avatars;
};

module.exports = { getRecommendations, getGameAnalysis, generateAvatarImages };
