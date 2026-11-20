import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    fetchCourts,
    fetchCoaches,
    fetchEquipment,
    fetchAvailability,
    calculatePrice,
    createBooking,
    joinWaitlist,
    getErrorMessage,
} from '../api';
import {
    toLocalDateString,
    formatDate,
    formatTime,
    formatTimeRange,
    formatMoney,
} from '../utils/format';
import './BookingPage.css';

const OPENING_TIME = '06:00';
const CLOSING_TIME = '21:00';

const overlaps = (startA, endA, startB, endB) => startA < endB && endA > startB;

const sortCourts = (list) =>
    [...list].sort((a, b) => {
        const extractNumber = (name) => {
            const match = String(name).match(/(\d+)/);
            return match ? parseInt(match[0], 10) : Number.POSITIVE_INFINITY;
        };
        return extractNumber(a.name) - extractNumber(b.name);
    });

const BookingPage = () => {
    const navigate = useNavigate();

    const [courts, setCourts] = useState([]);
    const [coaches, setCoaches] = useState([]);
    const [equipmentList, setEquipmentList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);

    const [selectedDate, setSelectedDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [selectedCourt, setSelectedCourt] = useState(null);
    const [selectedCoach, setSelectedCoach] = useState(null);
    const [selectedEquipment, setSelectedEquipment] = useState({});

    const [availability, setAvailability] = useState([]);
    const [availabilityError, setAvailabilityError] = useState(null);
    const [availabilityVersion, setAvailabilityVersion] = useState(0);

    const [priceDetails, setPriceDetails] = useState(null);
    const [priceLoading, setPriceLoading] = useState(false);
    const [priceError, setPriceError] = useState(null);
    const [priceVersion, setPriceVersion] = useState(0);

    const [error, setError] = useState(null);
    const [errorIsConflict, setErrorIsConflict] = useState(false);
    const [success, setSuccess] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [waitlistOpen, setWaitlistOpen] = useState(false);
    const [waitlistName, setWaitlistName] = useState('');
    const [waitlistEmail, setWaitlistEmail] = useState('');
    const [waitlistError, setWaitlistError] = useState(null);
    const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);

    const todayStr = toLocalDateString();
    const tomorrowStr = useMemo(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return toLocalDateString(tomorrow);
    }, []);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setLoadError(null);

        Promise.all([fetchCourts(), fetchCoaches(), fetchEquipment()])
            .then(([courtsRes, coachesRes, equipmentRes]) => {
                if (!active) return;
                setCourts(sortCourts(courtsRes.data));
                setCoaches(coachesRes.data);
                setEquipmentList(equipmentRes.data);
            })
            .catch((err) => {
                if (active) setLoadError(getErrorMessage(err, 'Could not load booking options.'));
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [reloadKey]);

    useEffect(() => {
        if (!selectedDate) {
            setAvailability([]);
            setAvailabilityError(null);
            return undefined;
        }

        let active = true;
        fetchAvailability(selectedDate)
            .then((res) => {
                if (!active) return;
                setAvailability(res.data);
                setAvailabilityError(null);
            })
            .catch((err) => {
                if (!active) return;
                setAvailability([]);
                setAvailabilityError(getErrorMessage(err, 'Availability could not be loaded.'));
            });

        return () => {
            active = false;
        };
    }, [selectedDate, availabilityVersion]);

    const timeError = useMemo(() => {
        if (!startTime || !endTime) return null;
        if (endTime <= startTime) return 'End time must be after the start time.';
        if (startTime < OPENING_TIME) return `The first slot starts at ${formatTime(OPENING_TIME)}.`;
        if (endTime > CLOSING_TIME) return `The last slot ends at ${formatTime(CLOSING_TIME)}.`;

        const now = new Date();
        const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        if (selectedDate === todayStr && startTime <= nowTime) {
            return 'That start time has already passed. Pick a later slot.';
        }
        return null;
    }, [startTime, endTime, selectedDate, todayStr]);

    const canCalculate = Boolean(selectedDate && startTime && endTime && selectedCourt && !timeError);

    useEffect(() => {
        if (!canCalculate) {
            setPriceDetails(null);
            setPriceLoading(false);
            setPriceError(null);
            return undefined;
        }

        let active = true;
        const equipment = Object.entries(selectedEquipment)
            .filter(([, quantity]) => Number(quantity) > 0)
            .map(([id, quantity]) => ({ id, quantity: Number(quantity) }));

        setPriceLoading(true);
        setPriceError(null);

        const timer = setTimeout(() => {
            calculatePrice({
                courtId: selectedCourt._id,
                date: selectedDate,
                startTime,
                endTime,
                coachId: selectedCoach?._id,
                equipment,
            })
                .then((res) => {
                    if (!active) return;
                    setPriceDetails(res.data);
                })
                .catch((err) => {
                    if (!active) return;
                    setPriceDetails(null);
                    setPriceError(getErrorMessage(err, 'Could not calculate the price for this slot.'));
                })
                .finally(() => {
                    if (active) setPriceLoading(false);
                });
        }, 350);

        return () => {
            active = false;
            clearTimeout(timer);
            setPriceLoading(false);
        };
    }, [canCalculate, selectedDate, startTime, endTime, selectedCourt, selectedCoach, selectedEquipment, priceVersion]);

    useEffect(() => {
        if (!waitlistOpen) return undefined;
        const onKeyDown = (event) => {
            if (event.key === 'Escape') setWaitlistOpen(false);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [waitlistOpen]);

    const conflictingCourtIds = useMemo(() => {
        if (!startTime || !endTime || timeError) return new Set();
        const ids = availability
            .filter((slot) => overlaps(startTime, endTime, slot.start_time, slot.end_time))
            .map((slot) => String(slot.court));
        return new Set(ids);
    }, [availability, startTime, endTime, timeError]);

    const conflictingCoachIds = useMemo(() => {
        if (!startTime || !endTime || timeError) return new Set();
        const ids = availability
            .filter((slot) => slot.coach && overlaps(startTime, endTime, slot.start_time, slot.end_time))
            .map((slot) => String(slot.coach));
        return new Set(ids);
    }, [availability, startTime, endTime, timeError]);

    const courtConflict = Boolean(
        selectedCourt && startTime && endTime && !timeError && conflictingCourtIds.has(selectedCourt._id)
    );
    const coachConflict = Boolean(
        selectedCoach && startTime && endTime && !timeError && conflictingCoachIds.has(selectedCoach._id)
    );

    const isSubmitDisabled = !priceDetails || isSubmitting || Boolean(timeError) || courtConflict || coachConflict;

    const slotsForCourt = (courtId) => availability.filter((slot) => String(slot.court) === courtId);

    const handleEquipmentChange = (item, nextValue) => {
        const parsed = Number.parseInt(nextValue, 10);
        const safeValue = Number.isNaN(parsed) ? 0 : Math.max(0, Math.min(item.total_quantity, parsed));
        setSelectedEquipment((prev) => ({ ...prev, [item._id]: safeValue }));
    };

    const handleBooking = async () => {
        if (isSubmitDisabled) return;
        setError(null);
        setErrorIsConflict(false);
        setSuccess(null);
        setIsSubmitting(true);

        try {
            const equipment = Object.entries(selectedEquipment)
                .filter(([, quantity]) => Number(quantity) > 0)
                .map(([id, quantity]) => ({ id, quantity: Number(quantity) }));

            await createBooking({
                courtId: selectedCourt._id,
                date: selectedDate,
                startTime,
                endTime,
                coachId: selectedCoach?._id,
                equipment,
            });

            setSuccess('Booking confirmed. You can review or cancel it from your booking history.');
            window.scrollTo({ top: 0, behavior: 'smooth' });

            setPriceDetails(null);
            setSelectedCourt(null);
            setSelectedCoach(null);
            setSelectedEquipment({});
            setStartTime('');
            setEndTime('');
            setSelectedDate('');
            setAvailabilityVersion((version) => version + 1);
        } catch (err) {
            const message = getErrorMessage(err, 'Booking failed. Please try again.');
            setError(message);
            setErrorIsConflict(/already booked/i.test(message));
            setAvailabilityVersion((version) => version + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const openWaitlist = () => {
        if (!selectedCourt || !selectedDate || !startTime || !endTime || timeError) return;
        setWaitlistError(null);
        setWaitlistOpen(true);
    };

    const handleJoinWaitlist = async (event) => {
        event.preventDefault();
        setWaitlistError(null);
        setWaitlistSubmitting(true);

        try {
            await joinWaitlist({
                date: selectedDate,
                startTime,
                endTime,
                courtId: selectedCourt._id,
                userEmail: waitlistEmail.trim(),
                userName: waitlistName.trim(),
            });

            setWaitlistOpen(false);
            setWaitlistName('');
            setWaitlistEmail('');
            setError(null);
            setErrorIsConflict(false);
            setSuccess('You are on the waitlist. We will notify you if this slot opens up.');
        } catch (err) {
            setWaitlistError(getErrorMessage(err, 'Could not join the waitlist.'));
        } finally {
            setWaitlistSubmitting(false);
        }
    };

    const selectedEquipmentCount = Object.values(selectedEquipment).reduce(
        (sum, quantity) => sum + Number(quantity || 0),
        0
    );

    return (
        <div className="page-container booking-page">
            <header className="page-heading">
                <div>
                    <h2>Book a Court</h2>
                    <p className="page-subtitle">
                        Pick a date, choose your court and add a coach or equipment. Bookings run from{' '}
                        {formatTime(OPENING_TIME)} to {formatTime(CLOSING_TIME)}.
                    </p>
                </div>
                <Link to="/history" className="ghost-link">My bookings</Link>
            </header>

            {error && (
                <div className="banner error-banner" role="alert">
                    <div>
                        <span>{error}</span>
                        {errorIsConflict && (
                            <button type="button" className="banner-action" onClick={openWaitlist}>
                                Join the waitlist
                            </button>
                        )}
                    </div>
                    <button type="button" className="banner-close" aria-label="Dismiss error" onClick={() => setError(null)}>
                        ×
                    </button>
                </div>
            )}

            {success && (
                <div className="banner success-banner" role="status">
                    <div>
                        <span>{success}</span>
                        <button type="button" className="banner-action" onClick={() => navigate('/history')}>
                            View booking history
                        </button>
                    </div>
                    <button type="button" className="banner-close" aria-label="Dismiss message" onClick={() => setSuccess(null)}>
                        ×
                    </button>
                </div>
            )}

            {loading ? (
                <div className="loading-state" role="status">
                    <span className="spinner" aria-hidden="true" />
                    Loading courts, coaches and equipment…
                </div>
            ) : loadError ? (
                <div className="empty-state">
                    <p>{loadError}</p>
                    <button type="button" className="btn-primary" onClick={() => setReloadKey((key) => key + 1)}>
                        Try again
                    </button>
                </div>
            ) : (
                <>
                    <div className="booking-grid">
                        <div className="form-section">
                            <section className="form-block">
                                <h3 className="form-step"><span className="step-index">1</span> Date and time</h3>

                                <div className="form-group">
                                    <label htmlFor="booking-date">Date</label>
                                    <div className="date-row">
                                        <input
                                            id="booking-date"
                                            type="date"
                                            value={selectedDate}
                                            min={todayStr}
                                            onChange={(event) => setSelectedDate(event.target.value)}
                                        />
                                        <div className="quick-dates">
                                            <button
                                                type="button"
                                                className={`chip ${selectedDate === todayStr ? 'active' : ''}`}
                                                onClick={() => setSelectedDate(todayStr)}
                                            >
                                                Today
                                            </button>
                                            <button
                                                type="button"
                                                className={`chip ${selectedDate === tomorrowStr ? 'active' : ''}`}
                                                onClick={() => setSelectedDate(tomorrowStr)}
                                            >
                                                Tomorrow
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="time-row">
                                    <div className="form-group">
                                        <label htmlFor="start-time">Start time</label>
                                        <input
                                            id="start-time"
                                            type="time"
                                            value={startTime}
                                            min={OPENING_TIME}
                                            max={CLOSING_TIME}
                                            step="900"
                                            onChange={(event) => setStartTime(event.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="end-time">End time</label>
                                        <input
                                            id="end-time"
                                            type="time"
                                            value={endTime}
                                            min={OPENING_TIME}
                                            max={CLOSING_TIME}
                                            step="900"
                                            onChange={(event) => setEndTime(event.target.value)}
                                        />
                                    </div>
                                </div>

                                {timeError && <p className="field-error" role="alert">{timeError}</p>}
                            </section>

                            <section className="form-block">
                                <h3 className="form-step"><span className="step-index">2</span> Choose a court</h3>
                                {availabilityError && <p className="field-note warn">{availabilityError}</p>}
                                {!availabilityError && !selectedDate && (
                                    <p className="field-note">Select a date to see which courts are already booked.</p>
                                )}

                                {courts.length === 0 ? (
                                    <p className="field-note">No courts are available right now.</p>
                                ) : (
                                    <div className="cards-grid">
                                        {courts.map((court) => {
                                            const daySlots = slotsForCourt(court._id);
                                            const isBookedNow = conflictingCourtIds.has(court._id);
                                            return (
                                                <button
                                                    type="button"
                                                    key={court._id}
                                                    className={`card selection-card court-card ${selectedCourt?._id === court._id ? 'selected' : ''} ${isBookedNow ? 'is-booked' : ''}`}
                                                    aria-pressed={selectedCourt?._id === court._id}
                                                    onClick={() => setSelectedCourt(court)}
                                                >
                                                    <span className="card-title">{court.name}</span>
                                                    <span className="card-subtitle">{court.type}</span>
                                                    {selectedDate && (
                                                        isBookedNow ? (
                                                            <span className="slot-badge slot-badge-danger">Booked for your time</span>
                                                        ) : daySlots.length > 0 ? (
                                                            <span className="slot-badge">{daySlots.length} booking{daySlots.length > 1 ? 's' : ''} that day</span>
                                                        ) : (
                                                            <span className="slot-badge slot-badge-success">Free that day</span>
                                                        )
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>

                            <section className="form-block">
                                <h3 className="form-step"><span className="step-index">3</span> Add a coach <span className="optional-tag">Optional</span></h3>
                                <div className="cards-grid coach-grid">
                                    <button
                                        type="button"
                                        className={`card selection-card coach-card ${selectedCoach === null ? 'selected' : ''}`}
                                        aria-pressed={selectedCoach === null}
                                        onClick={() => setSelectedCoach(null)}
                                    >
                                        <span className="card-title">No coach</span>
                                        <span className="card-subtitle">Play on your own</span>
                                    </button>
                                    {coaches.map((coach) => {
                                        const isBusy = conflictingCoachIds.has(coach._id);
                                        return (
                                            <button
                                                type="button"
                                                key={coach._id}
                                                className={`card selection-card coach-card ${selectedCoach?._id === coach._id ? 'selected' : ''} ${isBusy ? 'is-booked' : ''}`}
                                                aria-pressed={selectedCoach?._id === coach._id}
                                                onClick={() => setSelectedCoach(coach)}
                                            >
                                                <span className="card-title">{coach.name}</span>
                                                <span className="card-subtitle">Coach</span>
                                                {isBusy && <span className="slot-badge slot-badge-danger">Busy</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                                {coaches.length === 0 && <p className="field-note">No coaches are available right now.</p>}
                            </section>

                            <section className="form-block">
                                <h3 className="form-step"><span className="step-index">4</span> Equipment <span className="optional-tag">Optional</span></h3>
                                {equipmentList.length === 0 ? (
                                    <p className="field-note">No equipment is available right now.</p>
                                ) : (
                                    equipmentList.map((item) => {
                                        const quantity = Number(selectedEquipment[item._id] || 0);
                                        return (
                                            <div key={item._id} className="equipment-row">
                                                <div className="equipment-meta">
                                                    <span className="equipment-name">{item.name}</span>
                                                    <span className="equipment-available">Max {item.total_quantity}</span>
                                                </div>
                                                <div className="stepper-control">
                                                    <button
                                                        type="button"
                                                        className="stepper-btn"
                                                        aria-label={`Remove one ${item.name}`}
                                                        onClick={() => handleEquipmentChange(item, quantity - 1)}
                                                        disabled={quantity <= 0}
                                                    >
                                                        −
                                                    </button>
                                                    <input
                                                        type="number"
                                                        className="stepper-input"
                                                        min="0"
                                                        max={item.total_quantity}
                                                        value={quantity}
                                                        aria-label={`${item.name} quantity`}
                                                        onChange={(event) => handleEquipmentChange(item, event.target.value)}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="stepper-btn"
                                                        aria-label={`Add one ${item.name}`}
                                                        onClick={() => handleEquipmentChange(item, quantity + 1)}
                                                        disabled={quantity >= item.total_quantity}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </section>
                        </div>

                        <aside className="summary-section">
                            <h3>Booking summary</h3>

                            {courtConflict && (
                                <div className="slot-alert" role="alert">
                                    <strong>This court is booked for your time.</strong>
                                    <p>Join the waitlist and we will let you know if it opens up.</p>
                                    <button type="button" className="btn-warning" onClick={openWaitlist}>
                                        Join the waitlist
                                    </button>
                                </div>
                            )}

                            {coachConflict && (
                                <div className="slot-alert" role="alert">
                                    <strong>This coach is booked for your time.</strong>
                                    <p>Choose another coach or remove the coach to continue.</p>
                                </div>
                            )}

                            {priceDetails ? (
                                <>
                                    <div className="summary-selection">
                                        <span className="summary-date">{formatDate(selectedDate)}</span>
                                        <span>{formatTimeRange(startTime, endTime)}</span>
                                        <span>{selectedCourt?.name}{selectedCoach ? ` · ${selectedCoach.name}` : ''}</span>
                                        {selectedEquipmentCount > 0 && (
                                            <span>{selectedEquipmentCount} equipment item{selectedEquipmentCount > 1 ? 's' : ''}</span>
                                        )}
                                    </div>

                                    <div className="price-breakdown">
                                        {priceDetails.breakdown.map((item) => (
                                            <div key={item.label} className="price-row">
                                                <span>{item.label}</span>
                                                <span>{formatMoney(item.amount)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="total-row">
                                        <span>Total</span>
                                        <span>{formatMoney(priceDetails.totalPrice)}</span>
                                    </div>

                                    <button
                                        type="button"
                                        className="book-btn"
                                        onClick={handleBooking}
                                        disabled={isSubmitDisabled}
                                    >
                                        {isSubmitting ? 'Confirming…' : 'Confirm booking'}
                                    </button>
                                    <p className="summary-note">Pay on arrival. You can cancel from your booking history.</p>
                                </>
                            ) : priceLoading ? (
                                <div className="loading-state compact" role="status">
                                    <span className="spinner" aria-hidden="true" />
                                    Calculating price…
                                </div>
                            ) : priceError ? (
                                <div className="empty-state compact">
                                    <p>{priceError}</p>
                                    <button type="button" className="btn-primary" onClick={() => setPriceVersion((version) => version + 1)}>
                                        Retry
                                    </button>
                                </div>
                            ) : (
                                <ul className="summary-checklist">
                                    <li className={selectedDate ? 'done' : ''}>Choose a date</li>
                                    <li className={startTime && endTime && !timeError ? 'done' : ''}>Choose a valid time slot</li>
                                    <li className={selectedCourt ? 'done' : ''}>Select a court</li>
                                    <li className={priceDetails ? 'done' : ''}>Review the price</li>
                                </ul>
                            )}
                        </aside>
                    </div>

                    {priceDetails && (
                        <div className="mobile-checkout">
                            <div className="mobile-checkout-total">
                                <span>Total</span>
                                <strong>{formatMoney(priceDetails.totalPrice)}</strong>
                            </div>
                            <button
                                type="button"
                                className="book-btn"
                                onClick={handleBooking}
                                disabled={isSubmitDisabled}
                            >
                                {isSubmitting ? 'Confirming…' : 'Confirm booking'}
                            </button>
                        </div>
                    )}
                </>
            )}

            {waitlistOpen && (
                <div className="modal-backdrop" onClick={() => setWaitlistOpen(false)}>
                    <div
                        className="modal-card"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="waitlist-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="modal-head">
                            <h3 id="waitlist-title">Join the waitlist</h3>
                            <button
                                type="button"
                                className="banner-close"
                                aria-label="Close waitlist form"
                                onClick={() => setWaitlistOpen(false)}
                            >
                                ×
                            </button>
                        </div>
                        <p className="modal-copy">
                            {formatDate(selectedDate)} · {formatTimeRange(startTime, endTime)} · {selectedCourt?.name}
                        </p>
                        <form onSubmit={handleJoinWaitlist} className="modal-form">
                            <label htmlFor="waitlist-name">Name</label>
                            <input
                                id="waitlist-name"
                                type="text"
                                value={waitlistName}
                                onChange={(event) => setWaitlistName(event.target.value)}
                                maxLength={60}
                                required
                                autoFocus
                            />

                            <label htmlFor="waitlist-email">Email</label>
                            <input
                                id="waitlist-email"
                                type="email"
                                value={waitlistEmail}
                                onChange={(event) => setWaitlistEmail(event.target.value)}
                                required
                            />

                            {waitlistError && <p className="field-error" role="alert">{waitlistError}</p>}

                            <div className="modal-actions">
                                <button type="button" className="btn-ghost" onClick={() => setWaitlistOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={waitlistSubmitting}>
                                    {waitlistSubmitting ? 'Joining…' : 'Join waitlist'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingPage;
