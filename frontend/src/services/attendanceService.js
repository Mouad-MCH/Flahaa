import api from './api.js';

export const getWorkerAttendance = async (workerId, params = {}) => {
  const response = await api.get(`/attendance/${workerId}`, { params });
  return response.data.data;
};

export const getAttendanceByDate = async (params = {}) => {
  const response = await api.get('/attendance', { params });
  return response.data.data;
};

export const getAttendanceSummary = async (params = {}) => {
  const response = await api.get('/attendance/summary', { params });
  return response.data.data;
};

export const createAttendance = async (data, params = {}) => {
  const response = await api.post('/attendance', data, { params });
  return response.data.data;
};

export const bulkCreateAttendance = async (data, params = {}) => {
  const response = await api.post('/attendance/bulk', data, { params });
  return response.data.data;
};
