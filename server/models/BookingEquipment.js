const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BookingEquipment = sequelize.define('BookingEquipment', {
    quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
    },
});

module.exports = BookingEquipment;
