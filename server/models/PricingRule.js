const mongoose = require('mongoose');

const PricingRuleSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['PEAK_HOUR', 'WEEKEND', 'INDOOR', 'COACH', 'EQUIPMENT'],
        required: true
    },
    value: { type: Number, required: true },
    is_active: { type: Boolean, default: true },
});

module.exports = mongoose.model('PricingRule', PricingRuleSchema);
