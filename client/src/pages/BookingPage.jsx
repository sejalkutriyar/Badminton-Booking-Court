import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCourts, fetchCoaches, fetchEquipment, calculatePrice, createBooking } from '../api';
import './BookingPage.css';

const BookingPage = () => {
    const [courts, setCourts] = useState([]);
    const [coaches, setCoaches] = useState([]);
    const [equipmentList, setEquipmentList] = useState([]);
    const navigate = useNavigate();

    const [selectedDate, setSelectedDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [selectedCourt, setSelectedCourt] = useState(null);
    const [selectedCoach, setSelectedCoach] = useState(null);
    const [selectedEquipment, setSelectedEquipment] = useState({}); // { id: quantity }

    const [priceDetails, setPriceDetails] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        // Initial Data Fetch
        const loadData = async () => {
            try {
                const [cRes, coRes, eqRes] = await Promise.all([
                    fetchCourts(),
                    fetchCoaches(),
                    fetchEquipment()
                ]);
                setCourts(cRes.data);
                setCoaches(coRes.data);
                setEquipmentList(eqRes.data);
            } catch (err) {
                console.error('Failed to load initial data', err);
            }
        };
        loadData();
    }, []);

    // Hours Validation
    const [isTimeValid, setIsTimeValid] = useState(true);

    useEffect(() => {
        if (startTime || endTime) {
            const checkTime = (t) => {
                if (!t) return true;
                const hour = parseInt(t.split(':')[0]);
                return hour >= 6 && hour < 21; // 6 AM to 9 PM
            };

            const startValid = startTime ? parseInt(startTime.split(':')[0]) >= 6 && parseInt(startTime.split(':')[0]) < 21 : true;
            // End time check: if 21:00 it's fine. If 21:01 it's not.
            const endValid = endTime ? (
                parseInt(endTime.split(':')[0]) < 21 || (parseInt(endTime.split(':')[0]) === 21 && parseInt(endTime.split(':')[1]) === 0)
            ) && parseInt(endTime.split(':')[0]) >= 6 : true;

            setIsTimeValid(startValid && endValid);
        } else {
            setIsTimeValid(true);
        }
    }, [startTime, endTime]);

    // Live Price Calculation
    useEffect(() => {
        const getPrice = async () => {
            if (selectedDate && startTime && endTime && selectedCourt && isTimeValid) {
                try {
                    const eqArray = Object.entries(selectedEquipment)
                        .filter(([_, qty]) => qty > 0)
                        .map(([id, qty]) => ({ id, quantity: qty }));

                    const res = await calculatePrice({
                        courtId: selectedCourt._id,
                        date: selectedDate,
                        startTime,
                        endTime,
                        coachId: selectedCoach?._id,
                        equipment: eqArray
                    });
                    setPriceDetails(res.data);
                    setError(null);
                } catch (err) {
                    console.error(err);
                    setPriceDetails(null);
                }
            } else {
                setPriceDetails(null);
            }
        };

        const timer = setTimeout(getPrice, 500);
        return () => clearTimeout(timer);
    }, [selectedDate, startTime, endTime, selectedCourt, selectedCoach, selectedEquipment, isTimeValid]);

    const handleEquipmentChange = (id, value) => {
        if (value === '') {
            setSelectedEquipment(prev => ({
                ...prev,
                [id]: ''
            }));
            return;
        }
        const qty = parseInt(value);
        if (!isNaN(qty) && qty >= 0) {
            setSelectedEquipment(prev => ({
                ...prev,
                [id]: qty
            }));
        }
    };

    const handleBooking = async () => {
        try {
            setError(null);
            setSuccess(null);
            const eqArray = Object.entries(selectedEquipment)
                .filter(([_, qty]) => qty > 0)
                .map(([id, qty]) => ({ id, quantity: qty }));

            await createBooking({
                courtId: selectedCourt._id,
                date: selectedDate,
                startTime,
                endTime,
                coachId: selectedCoach?._id,
                equipment: eqArray
            });

            setSuccess('Booking Confirmed! You can check it in the History tab.');
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Reset selection
            setPriceDetails(null);
            setSelectedCourt(null);
            setSelectedEquipment({});
            setSelectedCoach(null);
            setStartTime('');
            setEndTime('');

        } catch (err) {
            setError(err.response?.data?.error || 'Booking Failed');
        }
    };

    return (
        <div className="page-container booking-page">
            <h2>Book a Court</h2>

            {error && <div className="error-banner">{error}</div>}
            {success && (
                <div className="success-banner">
                    {success} <br />
                    <button onClick={() => navigate('/history')} style={{ marginTop: '10px', textDecoration: 'underline', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}>
                        Go to History
                    </button>
                </div>
            )}
            {!isTimeValid && (
                <div className="warning-banner">
                    ⚠️ We are closed at this time! Opening hours: 6:00 AM - 9:00 PM
                </div>
            )}

            <div className="booking-grid">
                <div className="form-section">
                    <div className="form-group">
                        <label>Date</label>
                        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                    </div>

                    <div className="time-row">
                        <div className="form-group">
                            <label>Start Time</label>
                            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>End Time</label>
                            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Select Court</label>
                        <div className="cards-grid">
                            {courts.map(court => (
                                <div
                                    key={court._id}
                                    className={`card selection-card ${selectedCourt?._id === court._id ? 'selected' : ''}`}
                                    onClick={() => setSelectedCourt(court)}
                                >
                                    <div className="card-title">{court.name}</div>
                                    <div className="card-subtitle">{court.type}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Select Coach (Optional)</label>
                        <div className="cards-grid">
                            <div
                                className={`card selection-card ${selectedCoach === null ? 'selected' : ''}`}
                                onClick={() => setSelectedCoach(null)}
                            >
                                None
                            </div>
                            {coaches.map(coach => (
                                <div
                                    key={coach._id}
                                    className={`card selection-card ${selectedCoach?._id === coach._id ? 'selected' : ''}`}
                                    onClick={() => setSelectedCoach(coach)}
                                >
                                    {coach.name}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Equipment (Optional)</label>
                        {equipmentList.map(item => (
                            <div key={item._id} className="equipment-row">
                                <span>{item.name}</span>
                                <input
                                    type="number"
                                    min="0"
                                    max={item.total_quantity}
                                    value={selectedEquipment[item._id] !== undefined ? selectedEquipment[item._id] : 0}
                                    onChange={(e) => handleEquipmentChange(item._id, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="summary-section">
                    <h3>Booking Summary</h3>
                    {priceDetails ? (
                        <div className="price-breakdown">
                            {priceDetails.breakdown.map((item, idx) => (
                                <div key={idx} className="price-row">
                                    <span>{item.label}</span>
                                    <span>₹{item.amount}</span>
                                </div>
                            ))}
                            <div className="total-row">
                                <span>Total</span>
                                <span>₹{priceDetails.totalPrice}</span>
                            </div>
                            <button
                                className="book-btn"
                                onClick={handleBooking}
                                disabled={!isTimeValid}
                            >
                                Confirm Booking
                            </button>
                        </div>
                    ) : (
                        <p className="placeholder-text">Select details to see price</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingPage;
