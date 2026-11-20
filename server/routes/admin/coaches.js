const express = require('express');
const router = express.Router();
const Coach = require('../../models/Coach');
const Booking = require('../../models/Booking');

// Get all coaches
router.get('/', async (req, res) => {
    try {
        const coaches = await Coach.find({});
        res.json(coaches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create coach
router.post('/', async (req, res) => {
    try {
        const { name, is_active } = req.body;
        const coach = new Coach({ name: String(name || '').trim(), is_active });
        await coach.save();
        res.status(201).json(coach);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update coach
router.put('/:id', async (req, res) => {
    try {
        const { name, is_active } = req.body;
        const coach = await Coach.findById(req.params.id);
        if (!coach) return res.status(404).json({ error: 'Coach not found' });

        if (name) coach.name = String(name).trim();
        if (is_active !== undefined) coach.is_active = is_active;

        await coach.save();
        res.json(coach);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete coach
router.delete('/:id', async (req, res) => {
    try {
        const coach = await Coach.findById(req.params.id);
        if (!coach) return res.status(404).json({ error: 'Coach not found' });

        const usedByBookings = await Booking.exists({ coach: coach._id });
        if (usedByBookings) {
            return res.status(409).json({
                error: 'This coach has bookings and cannot be deleted. Mark them inactive instead.',
            });
        }

        await coach.deleteOne();
        res.json({ message: 'Coach deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
