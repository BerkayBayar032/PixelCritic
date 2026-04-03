import api from './api';

export const rateGame = async (gameId: string, score: number, platform: string) => {
  const { data } = await api.post('/ratings', { gameId, score, platform });
  return data;
};

export const getMyRating = async (gameId: string) => {
  const { data } = await api.get(`/ratings/game/${gameId}/me`);
  return data;
};

export const getRatingsByUser = async (userId: string) => {
  const { data } = await api.get(`/ratings/user/${userId}`);
  return data;
};

export const getRatingsByGame = async (gameId: string) => {
  const { data } = await api.get(`/ratings/game/${gameId}`);
  return data;
};

export const deleteMyRating = async (gameId: string) => {
  const { data } = await api.delete(`/ratings/game/${gameId}`);
  return data;
};
