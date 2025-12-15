const express = require('express');
const router = express.Router();
const Coach = require('../../models/Coach');

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
        const coach = new Coach({ name, is_active });
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

        if (name) coach.name = name;
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
        const result = await Coach.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).json({ error: 'Coach not found' });
        res.json({ message: 'Coach deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
