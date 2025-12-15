const express = require('express');
const router = express.Router();
const Waitlist = require('../models/Waitlist');

// Join Waitlist
router.post('/join', async (req, res) => {
    try {
        const { date, startTime, endTime, courtId, userEmail, userName } = req.body;
        console.log('[WAITLIST DEBUG] Request:', req.body);

        // Basic duplicate check
        const existing = await Waitlist.findOne({
            date,
            start_time: startTime,
            end_time: endTime,
            court: courtId,
            user_email: userEmail
        });

        if (existing) {
            return res.status(400).json({ error: 'You are already on the waitlist for this slot.' });
        }

        const entry = new Waitlist({
            date,
            start_time: startTime,
            end_time: endTime,
            court: courtId,
            user_email: userEmail,
            user_name: userName
        });

        await entry.save();
        res.status(201).json({ message: 'Joined waitlist successfully', entry });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get all waitlist (admin/debug)
router.get('/', async (req, res) => {
    try {
        const list = await Waitlist.find().populate('court').sort({ created_at: 1 });
        res.json(list);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
