import api from "./api.js";

export const getMyFarms = async () => {
    const response = await api.get('/farms/my-farms');
    return response.data.data;
}
