import api from './api.js';

export const listWorkers = async (params = {}) => {
  const response = await api.get('/workers', { params });
  return response.data.data;
};

export const getWorker = async (id) => {
  const response = await api.get(`/workers/${id}`);
  return response.data.data.worker;
};

export const createWorker = async (data) => {
  const response = await api.post('/workers', data);
  return response.data.data.worker;
};

export const updateWorker = async (id, data) => {
  const response = await api.put(`/workers/${id}`, data);
  return response.data.data;
};

export const deleteWorker = async (id) => {
  const response = await api.delete(`/workers/${id}`);
  return response.data;
};
