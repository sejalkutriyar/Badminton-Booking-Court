# Database Design & Pricing Engine Approach

## 1. Database Design (MongoDB)
The application uses a **document-oriented** approach with MongoDB to ensure flexibility and scalability. We chose Mongoose for schema validation while keeping the data structure intuitive.

### Key Collections:
*   **Courts**: Stores static data about facilities (e.g., Name, Type: INDOOR/OUTDOOR). This allows the system to differentiate base prices.
*   **Bookings**: The core transactional collection. It links a `courtId`, `date`, `startTime`, and `endTime`.
    *   *Atomic Integrity*: To prevent double bookings, we query this collection for overlapping time slots before creating a new document.
*   **Equipment**: Manages inventory. Each item has a `total_quantity`. During booking, we check if the requested quantity exceeds `total_quantity - currently_rented`.
*   **Coaches**: Simple collection for available staff.
*   **PricingRules**: A dynamic configuration collection. Instead of hardcoding prices in the backend logic, we store values (e.g., `PEAK_HOUR_RATE`, `INDOOR_BASE_RATE`) here. This allows the admin to change prices without redeploying the code.

## 2. Pricing Engine Approach
The pricing logic is decoupled from the booking creation to ensure it can be calculated on-the-fly for the user (during selection) and final verification.

### Algorithm Steps:
1.  **Base Rate**: The engine first checks the **Court Type**. If it's 'INDOOR', it applies the premium indoor rate found in `PricingRules`.
2.  **Duration Multiplier**: It calculates the duration (End Time - Start Time) in hours.
3.  **Peak Hour Logic**: We iterate through every booked hour. If an hour falls within the defined "Peak Window" (e.g., 6 PM - 9 PM) as configured in the DB, a surcharge is added for that specific hour.
4.  **Add-ons**:
    *   **Coaches**: A fixed session fee is added if a coach is selected.
    *   **Equipment**: We iterate through selected items, multiplying `quantity * unit_price` (fetched from `PricingRules`).
5.  **Final Sum**: All components are summed up to return the final `totalPrice`.

### Why this approach?
*   **Flexibility**: Admins can change "Peak Hours" or "Base Rates" instantly.
*   **Transparency**: Users see the price update in real-time as they toggle equipment or change times.
*   **Accuracy**: By calculating granularly per hour, we handle split sessions (e.g., 5 PM to 7 PM, where only one hour is peak) correctly.
