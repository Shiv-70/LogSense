import axios from "axios";

const API = axios.create({
    baseURL: "https://logsense-backend-o3dn.onrender.com",
    headers: {
        "Content-Type": "application/json"
    }
});

export const getLogs = async () => {
    const response = await API.get("/logs");
    return response.data;
};

export const deleteLog = async (id) => {
    try {
        const response = await API.delete(`/logs/${id}`);

        console.log("DELETE RESPONSE:", response.data);

        return response.data;

    } catch (error) {
        console.error(
            "DELETE ERROR:",
            error.response?.data || error.message
        );

        throw error;
    }
};

export const getLogById = async (id) => {
    const response = await API.get(`/logs/${id}`);
    return response.data;
};

export const createLog = async (logData) => {
    const response = await API.post("/logs", logData);
    return response.data;
};

export default API;