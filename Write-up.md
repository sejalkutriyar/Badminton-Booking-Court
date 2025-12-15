# Design Decisions & Write-up

## Database Design
We transitioned from a planned MySQL schema to **MongoDB** to leverage flexibility and the active cloud instance provided.

### Models
- **Court**: Stores static court info (Indoor/Outdoor).
- **Booking**: The central collection. It references Court, Coach, and Equipment.
    - We chose to embed `Equipment` details (item ID + quantity) within the Booking document for faster read access and easier historical record keeping, rather than a separate join table.
- **PricingRule**: Stores dynamic rules for pricing logic, allowing admins (future scope) to adjust rates without code changes.

## Atomic Booking Logic
Concurrency and data integrity are handled via **MongoDB Transactions** (Mongoose Sessions).
When a user attempts to book:
1.  A transaction session starts.
2.  We query for **overlapping bookings** for the specific Court and Coach within the requested time window (`$lt` end_time AND `$gt` start_time).
3.  We aggregate equipment usage for the time window to ensure quantity doesn't exceed `total_quantity`.
4.  If any check fails, the transaction aborts and an error is returned.
5.  If all pass, the Booking is saved and the transaction commits.

## Pricing Engine
The `PricingService` is decoupled from the booking logic. It accepts a "request object" (time, court type, addons) and returns a detailed `breakdown`.
- **Stacking Rules**: The engine iterates through active `PricingRules` and applies them cumulatively.
- **Flexibility**: New rules (e.g., "Holiday Special") can be added to the DB and mapped in the service with minimal changes.

## Future Improvements
- **Authentication**: Real user login.
- **Payment Integration**: Stripe/Razorpay.
- **Admin UI**: Interface to manage Courts and Pricing Rules.
