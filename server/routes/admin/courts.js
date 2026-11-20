const express = require('express');
const router = express.Router();
const Court = require('../../models/Court');
const Booking = require('../../models/Booking');

// Get all courts (including inactive)
router.get('/', async (req, res) => {
    try {
        const courts = await Court.find({});
        res.json(courts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new court
router.post('/', async (req, res) => {
    try {
        const { name, type, is_active } = req.body;
        const court = new Court({ name: String(name || '').trim(), type, is_active });
        await court.save();
        res.status(201).json(court);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update court
router.put('/:id', async (req, res) => {
    try {
        const { name, type, is_active } = req.body;
        const court = await Court.findById(req.params.id);
        if (!court) return res.status(404).json({ error: 'Court not found' });

        if (name) court.name = String(name).trim();
        if (type) court.type = type;
        if (is_active !== undefined) court.is_active = is_active;

        await court.save();
        res.json(court);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete court (Hard delete or Soft delete depending on requirement, usually soft delete is safer but let's allow hard delete for now if no bookings exist, or just toggle active. Sticking to simple hard delete for admin power, or just toggle active via PUT)
// Let's implement DELETE as hard delete for now.
router.delete('/:id', async (req, res) => {
    try {
        const court = await Court.findById(req.params.id);
        if (!court) return res.status(404).json({ error: 'Court not found' });

        const usedByBookings = await Booking.exists({ court: court._id });
        if (usedByBookings) {
            return res.status(409).json({
                error: 'This court has bookings and cannot be deleted. Mark it inactive instead.',
            });
        }

        await court.deleteOne();
        res.json({ message: 'Court deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
