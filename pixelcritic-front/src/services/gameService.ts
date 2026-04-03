import api from './api';

export const getTrendingGames = async (limit = 6) => {
  const { data } = await api.get(`/games/trending?limit=${limit}`);
  return data;
};

export const getNewReleases = async (limit = 6) => {
  const { data } = await api.get(`/games/new-releases?limit=${limit}`);
  return data;
};

export const getGamesByGenre = async (genre: string, limit = 10) => {
  const { data } = await api.get(`/games/genre/${encodeURIComponent(genre)}?limit=${limit}`);
  return data;
};

export const getGameById = async (id: string) => {
  const { data } = await api.get(`/games/${id}`);
  return data;
};

export const searchGames = async (query: string, limit = 10) => {
  const { data } = await api.get(`/games/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  return data;
};

export interface GamesQueryParams {
  genre?: string[];
  theme?: string[];
  platform?: string[];
  developer?: string[];
  publisher?: string[];
  minScore?: number;
  maxScore?: number;
  sort?: string;
  search?: string;
  collection?: string;
  page?: number;
  limit?: number;
}

export const getGames = async (params: GamesQueryParams = {}) => {
  const searchParams = new URLSearchParams();

  if (params.genre) params.genre.forEach(g => searchParams.append('genre', g));
  if (params.theme) params.theme.forEach(t => searchParams.append('theme', t));
  if (params.platform) params.platform.forEach(p => searchParams.append('platform', p));
  if (params.developer) params.developer.forEach(d => searchParams.append('developer', d));
  if (params.publisher) params.publisher.forEach(p => searchParams.append('publisher', p));
  if (params.minScore !== undefined) searchParams.set('minScore', String(params.minScore));
  if (params.maxScore !== undefined) searchParams.set('maxScore', String(params.maxScore));
  if (params.sort) searchParams.set('sort', params.sort);
  if (params.search) searchParams.set('search', params.search);
  if (params.collection) searchParams.set('collection', params.collection);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));

  const { data } = await api.get(`/games?${searchParams.toString()}`);
  return data;
};
