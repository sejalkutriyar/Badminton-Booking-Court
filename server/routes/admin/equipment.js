const express = require('express');
const router = express.Router();
const Equipment = require('../../models/Equipment');
const Booking = require('../../models/Booking');

// Get all equipment
router.get('/', async (req, res) => {
    try {
        const equipment = await Equipment.find({});
        res.json(equipment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create equipment
router.post('/', async (req, res) => {
    try {
        const { name, total_quantity } = req.body;
        const quantity = Number(total_quantity);
        if (!Number.isInteger(quantity) || quantity < 0) {
            return res.status(400).json({ error: 'Total quantity must be zero or a positive whole number.' });
        }

        const equipment = new Equipment({ name: String(name || '').trim(), total_quantity: quantity });
        await equipment.save();
        res.status(201).json(equipment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update equipment
router.put('/:id', async (req, res) => {
    try {
        const { name, total_quantity } = req.body;
        const equipment = await Equipment.findById(req.params.id);
        if (!equipment) return res.status(404).json({ error: 'Equipment not found' });

        if (name) equipment.name = String(name).trim();
        if (total_quantity !== undefined) {
            const quantity = Number(total_quantity);
            if (!Number.isInteger(quantity) || quantity < 0) {
                return res.status(400).json({ error: 'Total quantity must be zero or a positive whole number.' });
            }
            equipment.total_quantity = quantity;
        }

        await equipment.save();
        res.json(equipment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete equipment
router.delete('/:id', async (req, res) => {
    try {
        const equipment = await Equipment.findById(req.params.id);
        if (!equipment) return res.status(404).json({ error: 'Equipment not found' });

        const usedByBookings = await Booking.exists({ 'equipment.item': equipment._id });
        if (usedByBookings) {
            return res.status(409).json({
                error: 'This equipment appears in existing bookings and cannot be deleted.',
            });
        }

        await equipment.deleteOne();
        res.json({ message: 'Equipment deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
