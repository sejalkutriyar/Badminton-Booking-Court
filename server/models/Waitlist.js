const mongoose = require('mongoose');

const WaitlistSchema = new mongoose.Schema({
    date: { type: String, required: true }, // YYYY-MM-DD
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
    court: { type: mongoose.Schema.Types.ObjectId, ref: 'Court' }, // Optional preference
    user_email: { type: String, required: true }, // Placeholder for user ID
    user_name: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Waitlist', WaitlistSchema);
