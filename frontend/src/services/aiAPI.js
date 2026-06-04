import api from './api';

export const aiAPI = {
    getFuelPrediction: async (stateCode) => {
        const response = await api.get(`/ai/predict/fuel?stateCode=${stateCode}`);
        return response.data;
    },
    getAQIPrediction: async (city) => {
        const response = await api.get(`/ai/predict/aqi?city=${city}`);
        return response.data;
    },
    getTrafficPrediction: async (city, lat, lng) => {
        const response = await api.get(`/ai/predict/traffic`, { params: { city, lat, lng } });
        return response.data;
    },
    chatAssistant: async (message, context) => {
        const response = await api.post(`/ai/chat`, { message, context });
        return response.data;
    },
    getRiskScore: async (district, lat, lng) => {
        const response = await api.get(`/ai/risk-score`, { params: { district, lat, lng } });
        return response.data;
    },
    verifyAlertData: async (alertData) => {
        const response = await api.post(`/ai/verify-alert`, alertData);
        return response.data;
    }
};
