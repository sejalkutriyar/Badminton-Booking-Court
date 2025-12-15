const express = require('express');
const router = express.Router();
const Equipment = require('../../models/Equipment');

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
        const equipment = new Equipment({ name, total_quantity });
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

        if (name) equipment.name = name;
        if (total_quantity !== undefined) equipment.total_quantity = total_quantity;

        await equipment.save();
        res.json(equipment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete equipment
router.delete('/:id', async (req, res) => {
    try {
        const result = await Equipment.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).json({ error: 'Equipment not found' });
        res.json({ message: 'Equipment deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
