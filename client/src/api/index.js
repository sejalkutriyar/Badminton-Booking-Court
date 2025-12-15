import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

export const fetchCourts = () => API.get('/courts');
export const fetchCoaches = () => API.get('/coaches');
export const fetchEquipment = () => API.get('/equipment');
export const calculatePrice = (data) => API.post('/pricing/calculate', data);
export const createBooking = (data) => API.post('/bookings', data);
export const fetchHistory = () => API.get('/bookings');
export const cancelBooking = (id) => API.delete(`/bookings/${id}`);
export const clearHistory = () => API.delete('/bookings');

export const joinWaitlist = (data) => API.post('/waitlist/join', data);

export default API;

// Admin APIs
export const fetchAdminCourts = () => API.get('/admin/courts');
export const createCourt = (data) => API.post('/admin/courts', data);
export const updateCourt = (id, data) => API.put(`/admin/courts/${id}`, data);
export const deleteCourt = (id) => API.delete(`/admin/courts/${id}`);

export const fetchAdminCoaches = () => API.get('/admin/coaches');
export const createCoach = (data) => API.post('/admin/coaches', data);
export const updateCoach = (id, data) => API.put(`/admin/coaches/${id}`, data);
export const deleteCoach = (id) => API.delete(`/admin/coaches/${id}`);

export const fetchAdminEquipment = () => API.get('/admin/equipment');
export const createEquipment = (data) => API.post('/admin/equipment', data);
export const updateEquipment = (id, data) => API.put(`/admin/equipment/${id}`, data);
export const deleteEquipment = (id) => API.delete(`/admin/equipment/${id}`);

export const fetchAdminPricing = () => API.get('/admin/pricing');
export const createPricingRule = (data) => API.post('/admin/pricing', data);
export const updatePricing = (id, data) => API.put(`/admin/pricing/${id}`, data);
export const deletePricingRule = (id) => API.delete(`/admin/pricing/${id}`);

export const fetchWaitlist = () => API.get('/waitlist');
