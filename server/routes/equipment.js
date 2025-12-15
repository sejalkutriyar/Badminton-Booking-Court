const express = require('express');
const router = express.Router();
const Equipment = require('../models/Equipment');

router.get('/', async (req, res) => {
    try {
        const equipment = await Equipment.find();
        res.json(equipment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
