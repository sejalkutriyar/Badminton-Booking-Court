const express = require('express');
const router = express.Router();
const Waitlist = require('../models/Waitlist');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Join Waitlist
router.post('/join', async (req, res) => {
    try {
        const { date, startTime, endTime, courtId, userEmail, userName } = req.body;

        if (!date || !startTime || !endTime || !courtId) {
            return res.status(400).json({ error: 'Date, time and court are required.' });
        }

        const email = String(userEmail || '').trim().toLowerCase();
        const name = String(userName || '').trim();

        if (!name) return res.status(400).json({ error: 'Please enter your name.' });
        if (!EMAIL_PATTERN.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });

        const existing = await Waitlist.findOne({
            date,
            start_time: startTime,
            end_time: endTime,
            court: courtId,
            user_email: email,
        });

        if (existing) {
            return res.status(409).json({ error: 'You are already on the waitlist for this slot.' });
        }

        const entry = await Waitlist.create({
            date,
            start_time: startTime,
            end_time: endTime,
            court: courtId,
            user_email: email,
            user_name: name,
        });

        res.status(201).json({ message: 'Joined waitlist successfully', entry });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get all waitlist (admin)
router.get('/', async (req, res) => {
    try {
        const list = await Waitlist.find().populate('court').sort({ created_at: 1 });
        res.json(list);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
