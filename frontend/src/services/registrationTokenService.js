import api from "./api.js";

export const getRegistrationTokenInfo = async (token) => {

    const response = await api.get(
        '/registration-tokens/validate',
        {
            params: { token }
        }
    )

    return response.data.data;
}

export const createRegistrationToken = async (data) => {
    const response = await api.post(
        '/registration-tokens',
        data
    )

    return response.data.data
}