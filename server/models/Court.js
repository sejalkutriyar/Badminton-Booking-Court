const mongoose = require('mongoose');

const CourtSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['INDOOR', 'OUTDOOR'], required: true },
    is_active: { type: Boolean, default: true },
});

module.exports = mongoose.model('Court', CourtSchema);
