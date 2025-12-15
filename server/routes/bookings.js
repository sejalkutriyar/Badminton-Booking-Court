const express = require('express');
const router = express.Router();
const bookingService = require('../services/bookingService');

// Create Booking
router.post('/', async (req, res) => {
    try {
        const result = await bookingService.createBooking(req.body);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
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

// Clear history (dangerous: deletes all bookings) — use confirmation on client
router.delete('/', async (req, res) => {
    try {
        const result = await bookingService.clearHistory();
        res.json({ deletedCount: result.deletedCount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
