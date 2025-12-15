const express = require('express');
const router = express.Router();
const Court = require('../models/Court');

router.get('/', async (req, res) => {
    try {
        const courts = await Court.find({ is_active: true });
        res.json(courts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
