import api from './api';

export const followUser = async (userId: string) => {
  const { data } = await api.post(`/follows/${userId}`);
  return data;
};

export const unfollowUser = async (userId: string) => {
  const { data } = await api.delete(`/follows/${userId}`);
  return data;
};

export const checkFollow = async (userId: string) => {
  const { data } = await api.get(`/follows/${userId}/check`);
  return data;
};

export const getFollowers = async (userId: string) => {
  const { data } = await api.get(`/follows/${userId}/followers`);
  return data;
};

export const getFollowing = async (userId: string) => {
  const { data } = await api.get(`/follows/${userId}/following`);
  return data;
};

export const removeFollower = async (userId: string) => {
  const { data } = await api.delete(`/follows/${userId}/remove-follower`);
  return data;
};
