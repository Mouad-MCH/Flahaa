import api from './api.js';

export const listPayrolls = async (params = {}) => {
  const response = await api.get('/payrolls', { params });
  return { records: response.data.data, pagination: response.data.pagination };
};

export const calculatePayroll = async (data) => {
  const response = await api.post('/payrolls/calculate', data);
  return response.data.data;
};

export const updatePayrollStatus = async (id, status) => {
  const response = await api.patch(`/payrolls/${id}/status`, { status });
  return response.data.data;
};
