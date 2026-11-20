# Badminton Court Booking System

A clean, production-like MVP for booking badminton courts, built with Node.js, Express, MongoDB (Mongoose), and React.

## Features
- **Atomic Bookings**: Court, coach, and equipment overlap checks run one request at a time, so a slot cannot be double-booked.
- **Dynamic Pricing**: Calculates price based on time, court type, coach, and equipment.
- **Inventory Management**: Tracks equipment quantity availability per time slot.
- **Booking History**: View upcoming, past, and cancelled bookings, with soft cancellation that keeps the record visible.
- **Admin Panel**: CRUD for Courts, Coaches, Equipment, and Pricing Rules, with a live dashboard and delete guards.
- **Waitlist System**: Users can join a waitlist for fully booked slots; the first waiting entry is marked as notified when a booking is cancelled.
- **Enhanced UI**: Stepper controls, availability badges, responsive layout, and accessible controls.

## Tech Stack
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (via Mongoose)
- **Frontend**: React.js, Vite
- **Styling**: Vanilla CSS

## Assumptions Made
1.  **Single Timezone**: The system assumes all bookings are made in the local server time.
2.  **Fixed Slots**: While the DB supports minute-level precision, the UI encourages hourly slots for simplicity.
3.  **Payment**: We assume payment is "Pay on Arrival" mock, so no real payment gateway integration was required for this MVP.
4.  **Admin Access**: The `/admin` routes technically exist for everyone in this MVP (no authentication middleware was strictly mandated), but in production, this would be protected.

## 🔗 Live Deployment
- **Frontend App**: [badminton-booking-court-xi.vercel.app](https://badminton-booking-court-xi.vercel.app)
- **Backend API**: [badminton-booking-court.onrender.com](https://badminton-booking-court.onrender.com)

## Setup Instructions

### Prerequisites
- Node.js installed
- MongoDB connection string (set in `server/.env` as `MONGO_URI`)

### Backend Setup
1.  Navigate to the server directory:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create `server/.env` (see `server/.env.example`):
    ```env
    MONGO_URI=mongodb://127.0.0.1:27017/badminton
    PORT=5000
    ```
4.  Seed the database:
    *Note: The server automatically seeds baseline Courts, Equipment, Coaches, and Pricing Rules on startup if the database is empty.*
    To run manually:
    ```bash
    npm run seed
    ```
5.  Start the server:
    ```bash
    npm start
    # Runs on http://localhost:5000
    ```

### Frontend Setup
1.  Navigate to the client directory:
    ```bash
    cd client
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Optional: create `client/.env` (see `client/.env.example`) to point at a different API:
    ```env
    VITE_API_URL=http://localhost:5000/api
    ```
4.  Start the development server:
    ```bash
    npm run dev
    # Runs on http://localhost:5173
    ```

## API Endpoints

- `GET /api/health`: health check with uptime
- `GET /api/courts`: list active courts
- `GET /api/coaches`: list active coaches
- `GET /api/equipment`: list equipment
- `POST /api/bookings`: create a booking (validates hours, past dates, overlaps, inventory)
- `GET /api/bookings`: get history
- `GET /api/bookings/availability?date=YYYY-MM-DD`: confirmed slots for a date
- `DELETE /api/bookings/:id`: cancel a booking (soft cancel, keeps history)
- `DELETE /api/bookings`: clear all history
- `POST /api/pricing/calculate`: get price breakdown
- `POST /api/waitlist/join`: join waitlist
- `GET /api/waitlist`: view waitlist (Admin)
- `/api/admin/*`: Admin CRUD endpoints for courts, coaches, equipment, pricing

