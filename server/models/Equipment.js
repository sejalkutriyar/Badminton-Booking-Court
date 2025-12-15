const mongoose = require('mongoose');

const EquipmentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    total_quantity: { type: Number, default: 0 },
});

module.exports = mongoose.model('Equipment', EquipmentSchema);
