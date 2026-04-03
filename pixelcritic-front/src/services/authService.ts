import api from './api';

export const registerUser = async (username: string, email: string, password: string) => {
  const { data } = await api.post('/auth/register', { username, email, password });
  return data;
};

export const loginUser = async (identifier: string, password: string) => {
  const { data } = await api.post('/auth/login', { identifier, password });
  return data;
};

export const getMe = async () => {
  const { data } = await api.get('/auth/me');
  return data;
};

export const forgotPassword = async (email: string) => {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
};

export const resetPasswordApi = async (token: string, password: string) => {
  const { data } = await api.post('/auth/reset-password', { token, password });
  return data;
};
