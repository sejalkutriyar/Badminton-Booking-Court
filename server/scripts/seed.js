const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Court = require('../models/Court');
const Equipment = require('../models/Equipment');
const Coach = require('../models/Coach');
const PricingRule = require('../models/PricingRule');
const Booking = require('../models/Booking');

const seed = async () => {
    try {
        await connectDB();

        // Clear existing data
        await Court.deleteMany({});
        await Equipment.deleteMany({});
        await Coach.deleteMany({});
        await PricingRule.deleteMany({});
        await Booking.deleteMany({}); // Optional: clear bookings too

        // Courts
        await Court.insertMany([
            { name: 'Court 1 (Indoor)', type: 'INDOOR' },
            { name: 'Court 2 (Indoor)', type: 'INDOOR' },
            { name: 'Court 3 (Outdoor)', type: 'OUTDOOR' },
            { name: 'Court 4 (Outdoor)', type: 'OUTDOOR' },
        ]);

        // Equipment
        await Equipment.insertMany([
            { name: 'Racket', total_quantity: 20 },
            { name: 'Shuttlecock', total_quantity: 50 },
            { name: 'Shoes (Size 8)', total_quantity: 10 },
            { name: 'Shoes (Size 9)', total_quantity: 10 },
        ]);

        // Coaches
        await Coach.insertMany([
            { name: 'Coach John' },
            { name: 'Coach Sarah' },
            { name: 'Coach Mike' },
        ]);

        // Pricing Rules
        await PricingRule.insertMany([
            { type: 'INDOOR', value: 100.00 },
            { type: 'PEAK_HOUR', value: 50.00 },
            { type: 'WEEKEND', value: 20.00 },
            { type: 'COACH', value: 150.00 },
            { type: 'EQUIPMENT', value: 50.00 },
        ]);

        console.log('Seeding complete.');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seed();
