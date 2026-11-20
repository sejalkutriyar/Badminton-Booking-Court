const express = require('express');
const router = express.Router();
const PricingRule = require('../../models/PricingRule');

// Get all pricing rules
router.get('/', async (req, res) => {
    try {
        const rules = await PricingRule.find({});
        res.json(rules);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create pricing rule
router.post('/', async (req, res) => {
    try {
        const { type, value, is_active } = req.body;

        const numericValue = Number(value);
        if (!Number.isFinite(numericValue) || numericValue < 0) {
            return res.status(400).json({ error: 'Price must be zero or a positive number.' });
        }

        const duplicate = await PricingRule.findOne({ type });
        if (duplicate) {
            return res.status(409).json({ error: 'A rule for this type already exists. Edit the existing rule instead.' });
        }

        const rule = new PricingRule({ type, value: numericValue, is_active });
        await rule.save();
        res.status(201).json(rule);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update pricing rule
router.put('/:id', async (req, res) => {
    try {
        const { type, value, is_active } = req.body;
        const rule = await PricingRule.findById(req.params.id);
        if (!rule) return res.status(404).json({ error: 'Pricing Rule not found' });

        if (value !== undefined) {
            const numericValue = Number(value);
            if (!Number.isFinite(numericValue) || numericValue < 0) {
                return res.status(400).json({ error: 'Price must be zero or a positive number.' });
            }
            rule.value = numericValue;
        }

        if (type && type !== rule.type) {
            const duplicate = await PricingRule.findOne({ type, _id: { $ne: rule._id } });
            if (duplicate) {
                return res.status(409).json({ error: 'A rule for this type already exists. Edit the existing rule instead.' });
            }
            rule.type = type;
        }

        if (is_active !== undefined) rule.is_active = is_active;

        await rule.save();
        res.json(rule);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete pricing rule
router.delete('/:id', async (req, res) => {
    try {
        const result = await PricingRule.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).json({ error: 'Pricing Rule not found' });
        res.json({ message: 'Pricing Rule deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
