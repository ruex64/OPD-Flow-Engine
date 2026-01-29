# Phase 5: Simulation & Proof of Work - Quick Start Guide

## Overview
The simulation script demonstrates the OPD Flow Engine under realistic load conditions with mixed token types, slot selection, and cancellations.

## Prerequisites

1. **MongoDB Running**: Ensure MongoDB is accessible at the connection string in `.env`
2. **Dependencies Installed**: Run `npm install`
3. **Database Seeded**: Run `npm run seed` to populate with sample doctors and slots
4. **Server Running**: Start the API server with `npm run dev` in a separate terminal

## Running the Simulation

### Step-by-Step Instructions

**Terminal 1 - Start Server:**
```bash
npm run dev
```
Wait for: `🚀 OPD Flow Engine started successfully`

**Terminal 2 - Seed Database:**
```bash
npm run seed
```
Wait for: `🎉 Database seeding completed successfully!`

**Terminal 3 - Run Simulation:**
```bash
npm run simulate
```

## What the Simulation Does

### 1. Booking Phase (25 requests)
- **Mix of Token Types:**
  - 50% WALK_IN
  - 30% ONLINE
  - 15% FOLLOW_UP
  - 5% EMERGENCY

- **Random Distribution:**
  - Selects from 3 doctors
  - Spreads across 8 time slots per doctor (9 AM - 5 PM)
  - Uses realistic patient names

- **Demonstrates:**
  - Successful bookings
  - Slot capacity enforcement
  - Emergency overflow handling (exceeds capacity)
  - Failed bookings when slots are full

### 2. Cancellation Phase (5-8 cancellations)
- Randomly cancels 20-30% of successful bookings
- Shows slot count recovery
- Demonstrates transaction safety

### 3. Statistics & Analysis
- Booking success rate
- Token type distribution
- Emergency overbooking count
- Final slot utilization per doctor
- Available vs. full slots

## Expected Output

```
🚀 ========================================
📅 OPD Flow Engine - Day Simulation
🚀 ========================================

👨‍⚕️  Found 3 doctors:
   1. Dr. Rajesh Kumar (Cardiology)
   2. Dr. Priya Sharma (Pediatrics)
   3. Dr. Amit Patel (Orthopedics)

📅 Found 24 total slots across all doctors

🎬 ========================================
📋 Starting Token Booking Simulation
🎬 ========================================

[Request 1/25]
👤 Patient: Rahul Verma
🏥 Doctor: Dr. Rajesh Kumar (Cardiology)
⏰ Slot: 09:00 AM - 10:00 AM
🎫 Type: WALK_IN
✅ SUCCESS - Token booked successfully
   Token ID: 507f1f77bcf86cd799439012

[Request 2/25]
👤 Patient: Priya Singh
🏥 Doctor: Dr. Priya Sharma (Pediatrics)
⏰ Slot: 02:00 PM - 03:00 PM
🎫 Type: EMERGENCY
✅ SUCCESS - Emergency token booked (exceeding normal capacity)
   Token ID: 507f1f77bcf86cd799439013

...

📊 ========================================
📊 Simulation Summary
📊 ========================================

📈 Booking Statistics:
   Total Requests: 25
   ✅ Successful: 23
   ❌ Failed: 2
   🚨 Emergency Overbooked: 1
   📊 Success Rate: 92.0%

🔄 Cancellation Statistics:
   Cancellation Attempts: 6
   ✅ Successful: 6
   📊 Success Rate: 100.0%

🎫 Token Type Distribution:
   WALK_IN: 12 (52.2%)
   ONLINE: 7 (30.4%)
   FOLLOW_UP: 3 (13.0%)
   EMERGENCY: 1 (4.3%)

🏥 ========================================
🏥 Final Slot Status
🏥 ========================================

👨‍⚕️  Dr. Rajesh Kumar (Cardiology)
   Total Capacity: 80
   Tokens Booked: 45
   Utilization: 56.3%
   Available Slots: 4/8

...

💡 Key Observations:
   • EMERGENCY tokens can exceed capacity (elastic capacity)
   • Regular tokens are rejected when slot is full
   • Cancellations free up slots immediately
   • All operations are transaction-safe
```

## Validation Points

The simulation validates:

✅ **API Functionality**
- POST /api/book works correctly
- POST /api/cancel/:id works correctly
- GET /api/doctors/:id/slots returns accurate data

✅ **Business Logic**
- Slot capacity enforced for regular tokens
- Emergency tokens can exceed capacity
- Cancellations decrement slot count
- Concurrent bookings handled safely

✅ **Data Integrity**
- MongoDB transactions prevent inconsistent state
- Slot counts remain accurate
- No orphaned tokens or double bookings

✅ **Error Handling**
- Validation errors returned with 400 status
- Slot full errors returned with 409 status
- Server errors handled gracefully

## Customization

### Adjust Number of Requests
Edit `scripts/simulate_day.ts` line 156:
```typescript
const NUM_REQUESTS = 25; // Change to desired number (20-30 recommended)
```

### Adjust Cancellation Rate
Edit `scripts/simulate_day.ts` line 200:
```typescript
const numCancellations = Math.floor(bookedTokens.length * 0.25); // 25% cancellation rate
```

### Adjust Token Type Distribution
Edit `scripts/simulate_day.ts` function `getRandomTokenType()`:
```typescript
function getRandomTokenType(): TokenType {
  const rand = Math.random();
  if (rand < 0.5) return TokenType.WALK_IN;    // 50%
  if (rand < 0.8) return TokenType.ONLINE;     // 30%
  if (rand < 0.95) return TokenType.FOLLOW_UP; // 15%
  return TokenType.EMERGENCY;                   // 5%
}
```

## Troubleshooting

### "No doctors found"
- **Solution**: Run `npm run seed` before simulation

### "ECONNREFUSED" error
- **Solution**: Ensure server is running (`npm run dev`)
- **Check**: API_BASE_URL in `.env` or script defaults to `http://localhost:3000`

### "MongoDB connection failed"
- **Solution**: Check MONGODB_URI in `.env`
- **Verify**: MongoDB service is running

### Simulation hangs
- **Solution**: Check server logs for errors
- **Restart**: Both server and simulation

## Architecture Insights

The simulation demonstrates:

1. **Service-Layer Architecture**: Controllers → Services → Models
2. **Transaction Safety**: ACID properties maintained
3. **Validation**: Zod schemas enforce data integrity
4. **Error Handling**: Appropriate HTTP status codes
5. **Elastic Capacity**: Emergency overflow support

## Next Steps

After successful simulation:
- Review logs in `logs/` directory
- Check MongoDB data using MongoDB Compass
- Experiment with different token type distributions
- Add custom patient scenarios
- Extend with analytics and reporting
