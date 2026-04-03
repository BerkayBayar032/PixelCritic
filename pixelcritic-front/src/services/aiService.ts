import api from './api';

export const getRecommendations = async () => {
  const { data } = await api.get('/ai/recommendations');
  return data;
};

export const getGameAnalysis = async (gameId: string) => {
  const { data } = await api.get(`/ai/game-analysis/${gameId}`);
  return data;
};

export const generateAvatars = async (prompt: string) => {
  // Image generation can take longer, so use a 60s timeout
  const { data } = await api.post('/ai/generate-avatars', { prompt }, { timeout: 60000 });
  return data;
};
