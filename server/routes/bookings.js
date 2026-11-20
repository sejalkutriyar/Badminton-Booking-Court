const express = require('express');
const router = express.Router();
const bookingService = require('../services/bookingService');

const statusFor = (message) => {
    if (/not found/i.test(message)) return 404;
    if (/already booked|already cancelled/i.test(message)) return 409;
    return 400;
};

// Create Booking
router.post('/', async (req, res) => {
    try {
        const result = await bookingService.createBooking(req.body);
        res.status(201).json(result);
    } catch (error) {
        res.status(statusFor(error.message)).json({ error: error.message });
    }
});

// Get History
router.get('/', async (req, res) => {
    try {
        const history = await bookingService.getHistory();
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Confirmed bookings for a date (used by the booking page)
router.get('/availability', async (req, res) => {
    try {
        const slots = await bookingService.getAvailability(req.query.date);
        res.json(slots);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Cancel Booking
router.delete('/:id', async (req, res) => {
    try {
        const result = await bookingService.deleteBooking(req.params.id);
        res.json(result);
    } catch (error) {
        res.status(statusFor(error.message)).json({ error: error.message });
    }
});

// Clear All History
router.delete('/', async (req, res) => {
    try {
        const result = await bookingService.clearHistory();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
