const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    date: { type: String, required: true }, // YYYY-MM-DD
    start_time: { type: String, required: true }, // HH:mm
    end_time: { type: String, required: true }, // HH:mm
    court: { type: mongoose.Schema.Types.ObjectId, ref: 'Court', required: true },
    coach: { type: mongoose.Schema.Types.ObjectId, ref: 'Coach', default: null },
    equipment: [{
        item: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment' },
        quantity: { type: Number, default: 1 }
    }],
    total_price: { type: Number, required: true },
    status: { type: String, enum: ['CONFIRMED', 'CANCELLED'], default: 'CONFIRMED' },
});

module.exports = mongoose.model('Booking', BookingSchema);
