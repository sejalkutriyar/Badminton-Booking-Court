# Badminton Court Booking System

A clean, production-like MVP for booking badminton courts, built with Node.js, Express, MongoDB (Mongoose), and React.

## Features
- **Atomic Bookings**: Ensures no double bookings for courts or coaches.
- **Dynamic Pricing**: Calculates price based on time, court type, coach, and equipment.
- **Inventory Management**: Tracks equipment quantity availability.
- **Booking History**: View all past and upcoming bookings.

## Tech Stack
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (via Mongoose)
- **Frontend**: React.js, Vite
- **Styling**: Vanilla CSS

## Setup Instructions

### Prerequisites
- Node.js installed
- MongoDB connection string (provided in code)

### Backend Setup
1.  Navigate to the server directory:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Seed the database (Optional, runs once to populate courts):
    ```bash
    node scripts/seed.js
    ```
4.  Start the server:
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
3.  Start the development server:
    ```bash
    npm run dev
    # Runs on http://localhost:5173
    ```

## API Endpoints

- `GET /api/courts`: specific court details
- `GET /api/coaches`: list of coaches
- `GET /api/equipment`: list of equipment
- `POST /api/bookings`: create a booking
- `GET /api/bookings`: get history
- `POST /api/pricing/calculate`: get price breakdown

