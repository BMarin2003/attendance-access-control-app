import axios from 'axios';

const API_URL = 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
    },
});