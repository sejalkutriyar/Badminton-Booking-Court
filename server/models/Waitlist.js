const mongoose = require('mongoose');

const WaitlistSchema = new mongoose.Schema({
    date: { type: String, required: true }, // YYYY-MM-DD
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
    court: { type: mongoose.Schema.Types.ObjectId, ref: 'Court' }, // Optional preference
    user_email: { type: String, required: true },
    user_name: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    notified_at: { type: Date, default: null },
});

WaitlistSchema.index({ date: 1, court: 1, notified_at: 1 });

module.exports = mongoose.model('Waitlist', WaitlistSchema);
