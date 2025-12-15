import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5000/api',
});

export const fetchCourts = () => API.get('/courts');
export const fetchCoaches = () => API.get('/coaches');
export const fetchEquipment = () => API.get('/equipment');
export const calculatePrice = (data) => API.post('/pricing/calculate', data);
export const createBooking = (data) => API.post('/bookings', data);
export const fetchHistory = () => API.get('/bookings');
export const clearHistory = () => API.delete('/bookings');

export default API;
