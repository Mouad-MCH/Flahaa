import api from './api.js';

export const getWorkerAttendance = async (workerId, params = {}) => {
  const response = await api.get(`/attendance/${workerId}`, { params });
  return response.data.data;
};
