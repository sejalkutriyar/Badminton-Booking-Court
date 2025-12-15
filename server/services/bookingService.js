const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Court = require('../models/Court');
const Coach = require('../models/Coach');
const Equipment = require('../models/Equipment');
const pricingService = require('./pricingService');

class BookingService {
    async createBooking(data) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { date, startTime, endTime, courtId, coachId, equipment = [] } = data; // equipment: [{ id, quantity }]

            // 1. Check Court Availability
            // Mongoose doesn't have Op.or like Sequelize, uses $or
            const conflictingCourt = await Booking.findOne({
                court: courtId,
                date,
                status: 'CONFIRMED',
                $or: [
                    {
                        start_time: { $lt: endTime },
                        end_time: { $gt: startTime }
                    }
                ]
            }).session(session);

            if (conflictingCourt) {
                throw new Error('Court is already booked for this time slot.');
            }

            // 2. Check Coach Availability
            if (coachId) {
                const conflictingCoach = await Booking.findOne({
                    coach: coachId,
                    date,
                    status: 'CONFIRMED',
                    $or: [
                        {
                            start_time: { $lt: endTime },
                            end_time: { $gt: startTime }
                        }
                    ]
                }).session(session);

                if (conflictingCoach) {
                    throw new Error('Coach is already unavailable for this time slot.');
                }
            }

            // 3. Check Equipment Availability
            for (const item of equipment) {
                const eqItem = await Equipment.findById(item.id).session(session);
                if (!eqItem) throw new Error(`Equipment with ID ${item.id} not found.`);

                const activeBookings = await Booking.find({
                    date,
                    status: 'CONFIRMED',
                    'equipment.item': item.id,
                    $or: [
                        {
                            start_time: { $lt: endTime },
                            end_time: { $gt: startTime }
                        }
                    ]
                }).session(session);

                let usedQuantity = 0;
                activeBookings.forEach(b => {
                    const eqInBooking = b.equipment.find(e => e.item.toString() === item.id);
                    if (eqInBooking) {
                        usedQuantity += eqInBooking.quantity;
                    }
                });

                if (usedQuantity + item.quantity > eqItem.total_quantity) {
                    throw new Error(`Insufficient quantity for ${eqItem.name}. Available: ${eqItem.total_quantity - usedQuantity}`);
                }
            }

            // 4. Calculate Price
            const court = await Court.findById(courtId).session(session);
            if (!court) throw new Error('Court not found');

            const priceDetails = await pricingService.calculatePrice({
                courtType: court.type,
                date,
                startTime,
                endTime,
                hasCoach: !!coachId,
                equipmentCount: equipment.reduce((sum, item) => sum + item.quantity, 0)
            });

            // 5. Create Booking
            const newBooking = new Booking({
                date,
                start_time: startTime,
                end_time: endTime,
                court: courtId,
                coach: coachId || null,
                equipment: equipment.map(e => ({ item: e.id, quantity: e.quantity })),
                total_price: priceDetails.totalPrice,
                status: 'CONFIRMED'
            });

            await newBooking.save({ session });
            await session.commitTransaction();
            session.endSession();

            return { booking: newBooking, breakdown: priceDetails.breakdown };

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }

    async getHistory() {
        return await Booking.find()
            .populate('court')
            .populate('coach')
            .populate('equipment.item')
            .sort({ date: -1, start_time: -1 });
    }

    async clearHistory() {
        const result = await Booking.deleteMany({});
        return result;
    }

    async deleteBooking(id) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const booking = await Booking.findById(id).session(session);
            if (!booking) throw new Error('Booking not found');

            const { date, start_time, end_time, court } = booking;
            await Booking.findByIdAndDelete(id).session(session);

            // Check Waitlist
            const Waitlist = require('../models/Waitlist');
            const nextUser = await Waitlist.findOne({
                date,
                start_time,
                end_time,
                court
            }).sort({ created_at: 1 }).session(session);

            if (nextUser) {
                console.log(`[WAITLIST NOTIFICATION] Slot opened for ${date} ${start_time}! Notifying ${nextUser.user_email} (${nextUser.user_name})`);
                // In a real app, send email here.
                // Optionally remove from waitlist or keep until they book?
                // Let's keep them notified but not remove until they book or expire.
            }

            await session.commitTransaction();
            session.endSession();
            return { message: 'Booking cancelled' };
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }
}

module.exports = new BookingService();
