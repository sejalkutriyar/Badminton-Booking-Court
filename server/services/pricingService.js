const PricingRule = require('../models/PricingRule');

const round = (value) => Math.round(value * 100) / 100;

class PricingService {
    async calculatePrice(details) {
        const rules = await PricingRule.find({ is_active: true });
        const ruleMap = {};
        rules.forEach(rule => { ruleMap[rule.type] = rule.value; });

        let totalPrice = 0;
        const breakdown = [];

        const BASE_PRICE_PER_HOUR = 100;

        const startParts = String(details.startTime || '').split(':');
        const endParts = String(details.endTime || '').split(':');

        const start = new Date(0, 0, 0, Number(startParts[0]), Number(startParts[1]));
        const end = new Date(0, 0, 0, Number(endParts[0]), Number(endParts[1]));

        const durationHours = (end - start) / (1000 * 60 * 60);
        if (!Number.isFinite(durationHours) || durationHours <= 0) {
            throw new Error('Invalid time range');
        }

        const addLine = (label, amount) => {
            const rounded = round(amount);
            totalPrice += rounded;
            breakdown.push({ label, amount: rounded });
        };

        // 1. Base Cost
        addLine('Base Court Fee', BASE_PRICE_PER_HOUR * durationHours);

        // 2. Indoor Premium
        if (details.courtType === 'INDOOR') {
            const indoorPremium = (ruleMap['INDOOR'] || 0) * durationHours;
            if (indoorPremium > 0) addLine('Indoor Premium', indoorPremium);
        }

        // 3. Weekend Premium (parse YYYY-MM-DD as a local date, not UTC)
        const [year, month, day] = String(details.date || '').split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        const dayOfWeek = dateObj.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            const weekendPremium = (ruleMap['WEEKEND'] || 0) * durationHours;
            if (weekendPremium > 0) addLine('Weekend Premium', weekendPremium);
        }

        // 4. Peak Hour Premium (6-9 PM)
        const peakStart = 18;
        const peakEnd = 21;

        const startMinutes = Number(startParts[0]) * 60 + Number(startParts[1] || 0);
        const endMinutes = Number(endParts[0]) * 60 + Number(endParts[1] || 0);

        const overlapStart = Math.max(startMinutes, peakStart * 60);
        const overlapEnd = Math.min(endMinutes, peakEnd * 60);

        if (overlapEnd > overlapStart) {
            const overlapHours = (overlapEnd - overlapStart) / 60;
            const peakPremium = (ruleMap['PEAK_HOUR'] || 0) * overlapHours;
            if (peakPremium > 0) addLine('Peak Hour Premium', peakPremium);
        }

        // 5. Coach
        if (details.hasCoach) {
            addLine('Coach Fee', (ruleMap['COACH'] || 0) * durationHours);
        }

        // 6. Equipment (charged per item, not per hour)
        if (details.equipmentCount > 0) {
            addLine(`Equipment (${details.equipmentCount} items)`, (ruleMap['EQUIPMENT'] || 0) * details.equipmentCount);
        }

        return { totalPrice: round(totalPrice), breakdown };
    }
}

module.exports = new PricingService();
