const express = require('express');
const router = express.Router();
const Coach = require('../models/Coach');

router.get('/', async (req, res) => {
    try {
        const coaches = await Coach.find({ is_active: true });
        res.json(coaches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
