import api from './api';

export const getReviewsByGame = async (gameId: string, params: { platform?: string; sort?: string; page?: number } = {}) => {
  const searchParams = new URLSearchParams();
  if (params.platform) searchParams.set('platform', params.platform);
  if (params.sort) searchParams.set('sort', params.sort);
  if (params.page) searchParams.set('page', String(params.page));
  const { data } = await api.get(`/reviews/game/${gameId}?${searchParams.toString()}`);
  return data;
};

export const getReviewsByUser = async (userId: string) => {
  const { data } = await api.get(`/reviews/user/${userId}`);
  return data;
};

export const createReview = async (gameId: string, content: string, rating: number | undefined, platform: string) => {
  const body: any = { gameId, content, platform };
  if (rating) body.rating = rating;
  const { data } = await api.post('/reviews', body);
  return data;
};

export const deleteReview = async (reviewId: string) => {
  const { data } = await api.delete(`/reviews/${reviewId}`);
  return data;
};

export const voteOnReview = async (reviewId: string, type: 'upvote' | 'downvote') => {
  const { data } = await api.post(`/reviews/${reviewId}/vote`, { type });
  return data;
};

export const getMyVotes = async (gameId: string) => {
  const { data } = await api.get(`/reviews/game/${gameId}/my-votes`);
  return data;
};
