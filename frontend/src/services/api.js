import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "https://logsense-backend-o3dn.onrender.com/api",
    headers: { "Content-Type": "application/json" }
});

export const getLogs = async () => (await API.get("/logs")).data;
export const deleteLog = async (id) => (await API.delete(`/logs/${id}`)).data;
export const getLogById = async (id) => (await API.get(`/logs/${id}`)).data;
export const createLog = async (logData) => (await API.post("/logs", logData)).data;
export const getStats = async () => (await API.get("/logs/stats")).data;
export const getAlerts = async () => (await API.get("/logs/alerts")).data;
export const getAnomaly = async (id) => (await API.get(`/logs/anomalies/${id}`)).data;
export const analyzeAnomaly = async (id) => (await API.post(`/logs/anomalies/${id}/analyze`)).data;

export default API;
