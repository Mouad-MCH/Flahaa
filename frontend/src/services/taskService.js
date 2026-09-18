import api from './api.js';

export const listTasks = async (params = {}) => {
  const response = await api.get('/tasks', { params });
  return { tasks: response.data.data, pagination: response.data.pagination };
};

export const createTask = async (data) => {
  const response = await api.post('/tasks', data);
  return response.data.data;
};

export const deleteTask = async (id) => {
  const response = await api.delete(`/tasks/${id}`);
  return response.data;
};

export const addAssignees = async (id, worker_ids) => {
  const response = await api.post(`/tasks/${id}/assignments`, { worker_ids });
  return response.data.data;
};

export const removeAssignee = async (id, workerId) => {
  const response = await api.delete(`/tasks/${id}/assignments/${workerId}`);
  return response.data.data;
};

export const updateAssignmentStatus = async (id, workerId, status) => {
  const response = await api.patch(`/tasks/${id}/assignments/${workerId}/status`, { status });
  return response.data.data;
};

export const rateAssignment = async (id, workerId, rating) => {
  const response = await api.patch(`/tasks/${id}/assignments/${workerId}/rating`, { rating });
  return response.data.data;
};

export const listMyTasks = async (params = {}) => {
  const response = await api.get('/tasks/me', { params });
  return { tasks: response.data.data, pagination: response.data.pagination };
};

export const updateMyTaskStatus = async (id, status) => {
  const response = await api.patch(`/tasks/me/${id}/status`, { status });
  return response.data.data;
};
