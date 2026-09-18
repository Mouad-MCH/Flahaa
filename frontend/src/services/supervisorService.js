import api from "./api.js";


export const listSupervisor = async () => {
    const response = await api.get('/users/supervisors');
    return response.data.data
}

export const deleteSupervisor = async (id) => {
    const response = await api.delete(
    `/users/supervisors/${id}`,
    );

    return response.data.data
}

export const getSupervisor = async (id) => {
    const response = await api.get(`/users/supervisors/${id}`);

    return response.data.data
}

export const updateSupervisor = async (id, data) => {
    const response = await api.put(`/users/supervisors/${id}`, data);
    return response.data.data;
}