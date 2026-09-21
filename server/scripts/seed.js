const mongoose = require('mongoose');
const Court = require('../models/Court');
const Equipment = require('../models/Equipment');
const Coach = require('../models/Coach');
const PricingRule = require('../models/PricingRule');
const Booking = require('../models/Booking');

const seed = async () => {
    try {
        console.log('Clearing existing baseline data...');
        await Court.deleteMany({});
        await Equipment.deleteMany({});
        await Coach.deleteMany({});
        await PricingRule.deleteMany({});

        console.log('Seeding initial courts, equipment, coaches, and pricing rules...');
        await Court.insertMany([
            { name: 'Court 1 (Indoor)', type: 'INDOOR' },
            { name: 'Court 2 (Indoor)', type: 'INDOOR' },
            { name: 'Court 3 (Outdoor)', type: 'OUTDOOR' },
            { name: 'Court 4 (Outdoor)', type: 'OUTDOOR' },
        ]);

        await Equipment.insertMany([
            { name: 'Racket', total_quantity: 20 },
            { name: 'Shuttlecock', total_quantity: 50 },
            { name: 'Shoes (Size 8)', total_quantity: 10 },
            { name: 'Shoes (Size 9)', total_quantity: 10 },
        ]);

        await Coach.insertMany([
            { name: 'Coach John' },
            { name: 'Coach Sarah' },
            { name: 'Coach Mike' },
        ]);

        await PricingRule.insertMany([
            { type: 'INDOOR', value: 100.00 },
            { type: 'PEAK_HOUR', value: 50.00 },
            { type: 'WEEKEND', value: 20.00 },
            { type: 'COACH', value: 150.00 },
            { type: 'EQUIPMENT', value: 50.00 },
        ]);

        console.log('Seeding complete.');
    } catch (error) {
        console.error('Seeding failed:', error);
    }
};

module.exports = seed;

if (require.main === module) {
    const connectDB = require('../config/database');
    connectDB().then(async () => {
        await seed();
        process.exit(0);
    });
}

