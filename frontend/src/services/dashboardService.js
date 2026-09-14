import api from './api.js';


export const getDashboard = async () => {
    const response = await api.get('/dashboard');
    return response.data.data
}