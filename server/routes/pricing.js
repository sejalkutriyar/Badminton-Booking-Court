const express = require('express');
const router = express.Router();
const pricingService = require('../services/pricingService');
const Court = require('../models/Court');

router.post('/calculate', async (req, res) => {
    try {
        // Expect body: { courtId, date, startTime, endTime, coachId, equipment: [] }
        const { courtId, date, startTime, endTime, coachId, equipment = [] } = req.body;

        // Validate Court
        const court = await Court.findById(courtId);
        if (!court) return res.status(404).json({ error: 'Court not found' });

        const priceDetails = await pricingService.calculatePrice({
            courtType: court.type,
            date,
            startTime,
            endTime,
            hasCoach: !!coachId,
            equipmentCount: equipment.reduce((sum, item) => sum + item.quantity, 0)
        });

        res.json(priceDetails);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
