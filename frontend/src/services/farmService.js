import api from "./api.js";

export const getMyFarms = async () => {
    const response = await api.get('/farms/my-farms');
    return response.data.data;
}

export const createFarm = async (data) => {
    const response = await api.post('/farms/', data);

    return response.data.data;
}