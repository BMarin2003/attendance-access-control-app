import axios from 'axios';

const API_URL = 'https://dbcc12048e4c.ngrok-free.app/api/v1';

export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
    },
});