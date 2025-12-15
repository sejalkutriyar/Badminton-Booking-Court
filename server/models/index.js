const sequelize = require('../config/database');
const Court = require('./Court');
const Equipment = require('./Equipment');
const Coach = require('./Coach');
const Booking = require('./Booking');
const BookingEquipment = require('./BookingEquipment');
const PricingRule = require('./PricingRule');

// Associations

// Court <-> Booking
Court.hasMany(Booking, { foreignKey: 'court_id' });
Booking.belongsTo(Court, { foreignKey: 'court_id' });

// Coach <-> Booking
Coach.hasMany(Booking, { foreignKey: 'coach_id' });
Booking.belongsTo(Coach, { foreignKey: 'coach_id' });

// Booking <-> Equipment (Many-to-Many)
Booking.belongsToMany(Equipment, { through: BookingEquipment, foreignKey: 'booking_id' });
Equipment.belongsToMany(Booking, { through: BookingEquipment, foreignKey: 'equipment_id' });

module.exports = {
    sequelize,
    Court,
    Equipment,
    Coach,
    Booking,
    BookingEquipment,
    PricingRule,
};
