import api from './api';

export const getLibrary = async (userId: string, status?: string) => {
  const params: any = {};
  if (status) params.status = status;
  const { data } = await api.get(`/library/${userId}`, { params });
  return data;
};

export const getLibraryEntry = async (gameId: string) => {
  const { data } = await api.get(`/library/game/${gameId}`);
  return data;
};

export const addToLibrary = async (gameId: string, status: string) => {
  const { data } = await api.post('/library', { gameId, status });
  return data;
};

export const updateLibraryEntry = async (entryId: string, status: string) => {
  const { data } = await api.put(`/library/${entryId}`, { status });
  return data;
};

export const removeFromLibrary = async (entryId: string) => {
  const { data } = await api.delete(`/library/${entryId}`);
  return data;
};

export const removeFromLibraryByGameId = async (gameId: string) => {
  const { data } = await api.delete(`/library/game/${gameId}`);
  return data;
};
