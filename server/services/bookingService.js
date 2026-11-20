const Booking = require('../models/Booking');
const Court = require('../models/Court');
const Coach = require('../models/Coach');
const Equipment = require('../models/Equipment');
const Waitlist = require('../models/Waitlist');
const pricingService = require('./pricingService');

const OPENING_MINUTES = 6 * 60; // 06:00
const CLOSING_MINUTES = 21 * 60; // 21:00
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const toMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

const localDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const isValidDate = (date) => {
    if (typeof date !== 'string' || !DATE_PATTERN.test(date)) return false;
    const parsed = new Date(`${date}T00:00:00`);
    return !Number.isNaN(parsed.getTime()) && localDateString(parsed) === date;
};

// Booking creation runs one request at a time so two users cannot pass the
// availability checks for the same slot simultaneously.
let queue = Promise.resolve();
const runExclusive = (task) => {
    const result = queue.then(task, task);
    queue = result.catch(() => {});
    return result;
};

const validatePayload = (data) => {
    const { date, startTime, endTime, courtId } = data;

    if (!isValidDate(date)) throw new Error('Please provide a valid booking date.');
    if (!TIME_PATTERN.test(startTime || '')) throw new Error('Please provide a valid start time.');
    if (!TIME_PATTERN.test(endTime || '')) throw new Error('Please provide a valid end time.');
    if (!courtId) throw new Error('Please select a court.');

    const startMinutes = toMinutes(startTime);
    const endMinutes = toMinutes(endTime);

    if (startMinutes >= endMinutes) throw new Error('End time must be after start time.');
    if (startMinutes < OPENING_MINUTES || endMinutes > CLOSING_MINUTES) {
        throw new Error('Bookings are only available between 06:00 and 21:00.');
    }

    const now = new Date();
    const today = localDateString(now);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    if (date < today) throw new Error('Cannot book a date in the past.');
    if (date === today && startMinutes <= nowMinutes) {
        throw new Error('Cannot book a time that has already started.');
    }

    const items = Array.isArray(data.equipment) ? data.equipment : [];
    const merged = new Map();
    items.forEach(({ id, quantity }) => {
        if (!id) throw new Error('Invalid equipment selection.');
        if (!Number.isInteger(quantity) || quantity < 1) {
            throw new Error('Equipment quantity must be a whole number of at least 1.');
        }
        merged.set(String(id), (merged.get(String(id)) || 0) + quantity);
    });

    return {
        date,
        startTime,
        endTime,
        courtId,
        coachId: data.coachId || null,
        equipment: Array.from(merged, ([id, quantity]) => ({ id, quantity })),
    };
};

class BookingService {
    createBooking(data) {
        return runExclusive(() => this.createBookingNow(data));
    }

    async createBookingNow(data) {
        const { date, startTime, endTime, courtId, coachId, equipment } = validatePayload(data);

        const court = await Court.findById(courtId);
        if (!court) throw new Error('Court not found.');
        if (!court.is_active) throw new Error('This court is currently unavailable.');

        if (coachId) {
            const coach = await Coach.findById(coachId);
            if (!coach) throw new Error('Coach not found.');
            if (!coach.is_active) throw new Error('This coach is currently unavailable.');
        }

        const overlap = {
            date,
            status: 'CONFIRMED',
            start_time: { $lt: endTime },
            end_time: { $gt: startTime },
        };

        const courtConflict = await Booking.exists({ ...overlap, court: courtId });
        if (courtConflict) throw new Error('This court is already booked for the selected time slot.');

        if (coachId) {
            const coachConflict = await Booking.exists({ ...overlap, coach: coachId });
            if (coachConflict) throw new Error('This coach is already booked for the selected time slot.');
        }

        if (equipment.length > 0) {
            const equipmentIds = equipment.map((item) => item.id);
            const equipmentDocs = await Equipment.find({ _id: { $in: equipmentIds } });

            if (equipmentDocs.length !== equipment.length) {
                throw new Error('One or more selected equipment items no longer exist.');
            }

            const equipmentBookings = await Booking.find({ ...overlap, 'equipment.item': { $in: equipmentIds } });
            const usedQuantities = {};
            equipmentBookings.forEach((booking) => {
                booking.equipment.forEach((line) => {
                    const key = line.item.toString();
                    usedQuantities[key] = (usedQuantities[key] || 0) + line.quantity;
                });
            });

            equipment.forEach((item) => {
                const equipmentDoc = equipmentDocs.find((doc) => doc._id.toString() === item.id);
                const used = usedQuantities[item.id] || 0;
                const remaining = equipmentDoc.total_quantity - used;

                if (item.quantity > remaining) {
                    throw new Error(
                        `Only ${Math.max(remaining, 0)} ${equipmentDoc.name} available for this slot.`
                    );
                }
            });
        }

        const priceDetails = await pricingService.calculatePrice({
            courtType: court.type,
            date,
            startTime,
            endTime,
            hasCoach: !!coachId,
            equipmentCount: equipment.reduce((sum, item) => sum + item.quantity, 0),
        });

        const booking = await Booking.create({
            date,
            start_time: startTime,
            end_time: endTime,
            court: courtId,
            coach: coachId,
            equipment: equipment.map((item) => ({ item: item.id, quantity: item.quantity })),
            total_price: priceDetails.totalPrice,
            status: 'CONFIRMED',
        });

        return { booking, breakdown: priceDetails.breakdown };
    }

    async getHistory() {
        return Booking.find()
            .populate('court')
            .populate('coach')
            .populate('equipment.item')
            .sort({ date: -1, start_time: -1 });
    }

    async getAvailability(date) {
        if (!isValidDate(date)) throw new Error('Please provide a valid date.');

        return Booking.find({ date, status: 'CONFIRMED' })
            .select('court coach start_time end_time')
            .sort({ start_time: 1 });
    }

    async clearHistory() {
        return Booking.deleteMany({});
    }

    async deleteBooking(id) {
        return runExclusive(async () => {
            const booking = await Booking.findById(id);
            if (!booking) throw new Error('Booking not found.');
            if (booking.status === 'CANCELLED') throw new Error('This booking is already cancelled.');

            booking.status = 'CANCELLED';
            await booking.save();

            const waitlistEntry = await Waitlist.findOne({
                date: booking.date,
                start_time: booking.start_time,
                end_time: booking.end_time,
                court: booking.court,
                notified_at: null,
            }).sort({ created_at: 1 });

            if (waitlistEntry) {
                waitlistEntry.notified_at = new Date();
                await waitlistEntry.save();
                console.log(
                    `[WAITLIST NOTIFICATION] Slot ${booking.date} ${booking.start_time}-${booking.end_time} opened. ` +
                    `Notifying ${waitlistEntry.user_email} (${waitlistEntry.user_name}).`
                );
            }

            return { message: 'Booking cancelled', booking };
        });
    }
}

module.exports = new BookingService();
