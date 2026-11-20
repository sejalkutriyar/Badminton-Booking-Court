const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '100kb' }));

const Court = require('./models/Court');
const seed = require('./scripts/seed');

// Connect to database & auto-seed if empty
connectDB().then(async () => {
    try {
        const courtCount = await Court.countDocuments();
        if (courtCount === 0) {
            console.log('Database appears empty. Auto-seeding initial data...');
            await seed();
        }
    } catch (err) {
        console.error('Auto-seed check failed:', err);
    }
});

// Routes
const bookingRoutes = require('./routes/bookings');
const courtRoutes = require('./routes/courts');
const coachRoutes = require('./routes/coaches');
const equipmentRoutes = require('./routes/equipment');
const pricingRoutes = require('./routes/pricing');

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: Math.round(process.uptime()) });
});

app.use('/api/bookings', bookingRoutes);
app.use('/api/courts', courtRoutes);
app.use('/api/coaches', coachRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/admin', require('./routes/admin'));
app.use('/api/waitlist', require('./routes/waitlist'));

app.get('/', (req, res) => {
    res.send('Badminton Booking API is running (MongoDB)');
});

app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found.' });
});

app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Invalid JSON body.' });
    }
    console.error('Unhandled request error:', err);
    res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
