import api from './api';

export const getUserProfile = async (username: string) => {
  const { data } = await api.get(`/users/${username}`);
  return data;
};

export const updateProfile = async (updates: { bio?: string; avatar?: string }) => {
  const { data } = await api.put('/users/me', updates);
  return data;
};

export const searchUsers = async (q: string) => {
  const { data } = await api.get('/users/search', { params: { q } });
  return data;
};
