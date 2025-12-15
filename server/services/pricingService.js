const PricingRule = require('../models/PricingRule');

class PricingService {
    async calculatePrice(details) {
        const rules = await PricingRule.find({ is_active: true });
        const ruleMap = {};
        rules.forEach(r => ruleMap[r.type] = r.value);

        let totalPrice = 0;
        const breakdown = [];

        const BASE_PRICE_PER_HOUR = 100;

        // Convert HH:mm to usable logical parts
        const startParts = details.startTime.split(':');
        const endParts = details.endTime.split(':');

        // Create dummy dates to easier calculate diff
        const start = new Date(0, 0, 0, startParts[0], startParts[1]);
        const end = new Date(0, 0, 0, endParts[0], endParts[1]);

        const durationHours = (end - start) / (1000 * 60 * 60);

        if (durationHours <= 0) throw new Error('Invalid time range');

        // 1. Base Cost
        const baseCost = BASE_PRICE_PER_HOUR * durationHours;
        totalPrice += baseCost;
        breakdown.push({ label: 'Base Court Fee', amount: baseCost });

        // 2. Indoor Premium
        if (details.courtType === 'INDOOR') {
            const indoorPremium = (ruleMap['INDOOR'] || 0) * durationHours;
            if (indoorPremium > 0) {
                totalPrice += indoorPremium;
                breakdown.push({ label: 'Indoor Premium', amount: indoorPremium });
            }
        }

        // 3. Weekend Premium
        const dateObj = new Date(details.date);
        const day = dateObj.getDay();
        if (day === 0 || day === 6) {
            const weekendPremium = (ruleMap['WEEKEND'] || 0) * durationHours;
            if (weekendPremium > 0) {
                totalPrice += weekendPremium;
                breakdown.push({ label: 'Weekend Premium', amount: weekendPremium });
            }
        }

        // 4. Peak Hour Premium (6-9 PM)
        const peakStart = 18;
        const peakEnd = 21;

        const startHour = parseInt(startParts[0]);
        const endHour = parseInt(endParts[0]);

        const sMin = startHour * 60 + parseInt(startParts[1] || 0);
        const eMin = endHour * 60 + parseInt(endParts[1] || 0);

        const pSMin = peakStart * 60;
        const pEMin = peakEnd * 60;

        const overlapStart = Math.max(sMin, pSMin);
        const overlapEnd = Math.min(eMin, pEMin);

        if (overlapEnd > overlapStart) {
            const overlapHours = (overlapEnd - overlapStart) / 60;
            const peakPremium = (ruleMap['PEAK_HOUR'] || 0) * overlapHours;
            if (peakPremium > 0) {
                totalPrice += peakPremium;
                breakdown.push({ label: 'Peak Hour Premium', amount: peakPremium });
            }
        }

        // 5. Coach
        if (details.hasCoach) {
            const coachFee = (ruleMap['COACH'] || 0) * durationHours;
            totalPrice += coachFee;
            breakdown.push({ label: 'Coach Fee', amount: coachFee });
        }

        // 6. Equipment
        if (details.equipmentCount > 0) {
            const equipmentFee = (ruleMap['EQUIPMENT'] || 0) * details.equipmentCount;
            totalPrice += equipmentFee;
            breakdown.push({ label: `Equipment (${details.equipmentCount})`, amount: equipmentFee });
        }

        return { totalPrice: parseFloat(totalPrice.toFixed(2)), breakdown };
    }
}

module.exports = new PricingService();
