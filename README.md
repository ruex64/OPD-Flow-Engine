# OPD Flow Engine

OPD Token Allocation System with elastic capacity management, prioritization logic, and REST API endpoints.

## Features

**Token Booking System**
- Book tokens for patients with multiple types (Online, Walk-in, Emergency, Follow-up)
- Real-time slot availability checking
- Automatic capacity management with emergency overflow support

**Transaction-Safe Operations**
- MongoDB transactions ensure data consistency
- Atomic slot count updates during booking/cancellation
- Rollback support on errors

**RESTful API with Validation**
- Runtime validation using Zod schemas
- Comprehensive error handling with appropriate HTTP status codes
- Structured JSON responses

**Doctor & Slot Management**
- View all slots for a doctor with availability status
- Track current capacity vs. maximum capacity
- Filter available vs. full slots

**Production-Ready Architecture**
- Clean service-layer pattern
- TypeScript for type safety
- Winston logging for debugging
- Graceful shutdown and error recovery

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Database Setup](#database-setup)
- [API Documentation](#api-documentation)
- [Configuration](#configuration)
- [Prioritization Logic](#prioritization-logic--design-trade-offs)

## Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Validation**: Zod (Runtime type validation)
- **Logger**: Winston
- **Security**: Helmet, CORS
- **Development**: ts-node, nodemon

## Architecture

This project follows a clean **Service-Layer Architecture** with separation of concerns:

```
Controller -> Service -> Data Access (Models)
```

### Design Pattern

- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain business logic and data processing
- **Models**: Define data schemas and database interactions
- **Middleware**: Process requests before reaching controllers
- **Routes**: Define API endpoints and route handlers

## Project Structure

```
OPD-Flow-Engine/
├── src/
│   ├── app.ts                    # Express app configuration
│   ├── server.ts                 # Server entry point with graceful shutdown
│   ├── config/
│   │   └── db.ts                 # MongoDB connection configuration
│   ├── controllers/
│   │   ├── health.controller.ts  # Health check controller
│   │   └── tokenController.ts    # Token controller with validation
│   ├── services/
│   │   ├── health.service.ts     # Health check service
│   │   └── token.service.ts      # Token business logic and transactions
│   ├── routes/
│   │   ├── index.ts              # Route aggregator
│   │   ├── health.routes.ts      # Health check routes
│   │   └── api.ts                # API routes
│   ├── middleware/
│   │   └── errorHandler.ts       # Global error handler
│   ├── models/
│   │   ├── doctor.model.ts       # Doctor schema and interface
│   │   ├── slot.model.ts         # Slot schema and interface
│   │   └── token.model.ts        # Token schema and interface
│   └── utils/
│       └── logger.ts             # Winston logger configuration
├── scripts/
│   ├── seed.ts                   # Database seeding script
│   └── simulate_day.ts           # Day simulation & proof-of-work script
├── logs/                         # Application logs directory
├── .env                          # Environment variables
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore file
├── .eslintrc.json                # ESLint configuration
├── package.json                  # Project dependencies
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # Project documentation
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6.0 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd OPD-Flow-Engine
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your configuration:
   ```env
   NODE_ENV=production
   PORT=3000
   LOG_LEVEL=info
   
   # CORS Configuration
   # WARNING: CORS_ORIGIN set to * (allow all) intentionally for testing purposes
   # This is a known security flaw and should be restricted in production environments
   CORS_ORIGIN=*
   
   MONGODB_URI=mongodb://localhost:27017/opd-flow-engine
   ```

### Running the Application

#### Development Mode
```bash
npm run dev
```

#### Production Build
```bash
npm run build
npm start
```

### Available Scripts

- `npm run dev` - Start development server with hot reload (nodemon)
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server from compiled code
- `npm run start:dev` - Start development server without nodemon
- `npm run seed` - Seed database with sample data
- `npm run simulate` - Run day simulation (requires server to be running)
- `npm run lint` - Run ESLint to check code quality
- `npm run lint:fix` - Automatically fix ESLint errors

### Running the Simulation

The simulation script demonstrates the system under load with realistic booking patterns.

**Prerequisites:**
1. Start the server: `npm run dev` (in one terminal)
2. Seed the database: `npm run seed` (in another terminal)

**Run the simulation:**
```bash
npm run simulate
```

**What it does:**
- Simulates 25 token booking requests with realistic distribution:
  - 50% WALK_IN
  - 30% ONLINE
  - 15% FOLLOW_UP
  - 5% EMERGENCY
- Randomly distributes requests across doctors and time slots
- Demonstrates emergency overflow handling (elastic capacity)
- Cancels 20-30% of bookings to show slot recovery
- Displays comprehensive statistics and final slot utilization

**Sample Output:**
```
 Booking Statistics:
   Total Requests: 25
Booking Statistics:
   Total Requests: 25
   Successful: 23
   Failed: 2
   Emergency Overbooked: 1
   Success Rate: 92.0%

Key Observations:
   - EMERGENCY tokens can exceed capacity (elastic capacity)
   - Regular tokens are rejected when slot is full
   - Cancellations free up slots immediately
   -
## Database Setup

### MongoDB Connection

The application connects to MongoDB using the connection string defined in `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/opd-flow-engine
```

### Data Models

#### Doctor Model
```typescript
interface IDoctor {
  name: string;
  specialization: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Slot Model
```typescript
interface ISlot {
  doctorId: ObjectId;          // Reference to Doctor
  startTime: Date;
  endTime: Date;
  maxCapacity: number;
  currentCount: number;        // Default: 0
  createdAt: Date;
  updatedAt: Date;
}
```

**Virtual Properties:**
- `isAvailable`: Boolean indicating if slot has capacity
- `remainingSlots`: Number of available slots

#### Token Model
```typescript
interface IToken {
  slotId: ObjectId;            // Reference to Slot
  patientName: string;
  type: TokenType;             // ONLINE | WALK_IN | EMERGENCY | FOLLOW_UP
  status: TokenStatus;         // BOOKED | CANCELLED | COMPLETED | NO_SHOW
  requestTime: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Database Seeding

To populate the database with sample data:

```bash
npm run seed
```

This will:
1. Clear existing data from all collections
2. Create 3 doctors with different specializations
3. Generate 8 time slots (9 AM - 5 PM) for each doctor for today
4. Display a summary of seeded data

**Sample Output:**
```
Seeding Summary:
   Doctors: 3
   Slots: 24
   Tokens: 0 (empty)

Sample Data:
   Dr. Rajesh Kumar (Cardiology):
      09:00 AM - 10:00 AM | Capacity: 10
      10:00 AM - 11:00 AM | Capacity: 10
   ...
```

## API Documentation

### Health Check Endpoint

**GET** `/health`

Check if the server is running and healthy.

**Response:**
```json
{
  "success": true,
  "message": "OPD Flow Engine is running",
  "timestamp": "2026-01-28T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "development"
}
```

**Example:**
```bash
curl http://localhost:3000/health
```

---

### Token Booking API (Phase 4)

#### Book a Token

**POST** `/api/book`

Book a new token for a patient in a specific slot.

**Request Body:**
```json
{
  "patientName": "John Doe",
  "patientType": "WALK_IN",
  "slotId": "507f1f77bcf86cd799439011"
}
```

**Parameters:**
- `patientName` (string, required): Patient name (2-100 characters)
- `patientType` (enum, required): One of `ONLINE`, `WALK_IN`, `EMERGENCY`, `FOLLOW_UP`
- `slotId` (string, required): Valid MongoDB ObjectId of the slot

**Success Response (201):**
```json
{
  "success": true,
  "message": "Token booked successfully",
  "token": {
    "id": "507f1f77bcf86cd799439012",
    "slotId": "507f1f77bcf86cd799439011",
    "patientName": "John Doe",
    "type": "WALK_IN",
    "status": "BOOKED",
    "requestTime": "2026-01-29T10:00:00.000Z"
  },
  "slot": {
    "doctorId": "507f1f77bcf86cd799439010",
    "startTime": "2026-01-29T09:00:00.000Z",
    "endTime": "2026-01-29T10:00:00.000Z",
    "currentCount": 5,
    "maxCapacity": 10,
    "remainingSlots": 5
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation error or slot not found
- `409 Conflict`: Slot is full (for non-emergency bookings)
- `500 Internal Server Error`: Server error

**Examples:**
```bash
# Book a walk-in token
curl -X POST http://localhost:3000/api/book \
  -H "Content-Type: application/json" \
  -d '{
    "patientName": "John Doe",
    "patientType": "WALK_IN",
    "slotId": "507f1f77bcf86cd799439011"
  }'

# Book an emergency token (can exceed capacity)
curl -X POST http://localhost:3000/api/book \
  -H "Content-Type: application/json" \
  -d '{
    "patientName": "Jane Smith",
    "patientType": "EMERGENCY",
    "slotId": "507f1f77bcf86cd799439011"
  }'
```

---

#### Cancel a Token

**POST** `/api/cancel/:id`

Cancel an existing token by its ID.

**URL Parameters:**
- `id` (string, required): Token ID (MongoDB ObjectId)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token cancelled successfully",
  "token": {
    "id": "507f1f77bcf86cd799439012",
    "status": "CANCELLED"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid token ID, already cancelled, or already completed
- `404 Not Found`: Token not found
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl -X POST http://localhost:3000/api/cancel/507f1f77bcf86cd799439012
```

---

#### Get Doctor Slots

**GET** `/api/doctors/:id/slots`

Retrieve all slots for a specific doctor with availability status.

**URL Parameters:**
- `id` (string, required): Doctor ID (MongoDB ObjectId)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "doctor": {
      "id": "507f1f77bcf86cd799439010",
      "name": "Dr. Rajesh Kumar",
      "specialization": "Cardiology"
    },
    "slots": [
      {
        "id": "507f1f77bcf86cd799439011",
        "doctorId": "507f1f77bcf86cd799439010",
        "startTime": "2026-01-29T09:00:00.000Z",
        "endTime": "2026-01-29T10:00:00.000Z",
        "maxCapacity": 10,
        "currentCount": 5,
        "remainingSlots": 5,
        "isAvailable": true,
        "status": "AVAILABLE"
      },
      {
        "id": "507f1f77bcf86cd799439013",
        "doctorId": "507f1f77bcf86cd799439010",
        "startTime": "2026-01-29T10:00:00.000Z",
        "endTime": "2026-01-29T11:00:00.000Z",
        "maxCapacity": 10,
        "currentCount": 10,
        "remainingSlots": 0,
        "isAvailable": false,
        "status": "FULL"
      }
    ],
    "totalSlots": 8,
    "availableSlots": 6
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid doctor ID format
- `404 Not Found`: Doctor not found
- `500 Internal Server Error`: Server error

**Example:**
```bash
curl http://localhost:3000/api/doctors/507f1f77bcf86cd799439010/slots
```

---

### Validation Rules

All Phase 4 endpoints use **Zod** for runtime validation:

- **Patient Name**: 2-100 characters
- **Patient Type**: Must be one of: `ONLINE`, `WALK_IN`, `EMERGENCY`, `FOLLOW_UP`
- **MongoDB ObjectIds**: Must match format `/^[0-9a-fA-F]{24}$/`
- **Slot Existence**: Verified before booking
- **Doctor Existence**: Verified before retrieving slots

### Error Response Format

All error responses follow this consistent format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "details": [
      {
        "field": "fieldName",
        "message": "Specific validation error"
      }
    ]
  }
}
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Application environment | `production` |
| `PORT` | Server port number | `3000` |
| `LOG_LEVEL` | Winston log level (error, warn, info, debug) | `info` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/opd-flow-engine` |
| `CORS_ORIGIN` | Allowed CORS origins (set to `*` for testing - security flaw) | `*` |

**Security Note**: The `CORS_ORIGIN` is intentionally set to `*` (allow all origins) for testing purposes. This is a known security vulnerability and should be restricted to specific domains in production deployments.

### Logging Configuration

The application uses Winston for logging with the following configuration:

- **Development**: Console output with colors and formatted messages
- **Production**: File-based logging only
- **Log Files**:
  - `logs/error.log` - Error level logs only
  - `logs/combined.log` - All log levels

### Error Handling

The application includes comprehensive error handling:

1. **Global Error Handler**: Catches and formats all errors
2. **404 Handler**: Handles non-existent routes
3. **Graceful Shutdown**: Properly closes connections on SIGTERM/SIGINT
4. **Unhandled Rejections**: Catches uncaught promise rejections
5. **Uncaught Exceptions**: Handles uncaught exceptions

### Code Quality

ESLint is configured with TypeScript support:

```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
```

### TypeScript Configuration

- **Target**: ES2022
- **Module**: CommonJS
- **Strict Mode**: Enabled
- **Source Maps**: Enabled
- **Declaration Files**: Generated
- **Output Directory**: `dist/`

## Prioritization Logic & Design Trade-offs

### Current Implementation

The OPD Flow Engine implements a **capacity-based prioritization** system with emergency overflow support:

#### Token Type Hierarchy

1. **EMERGENCY** (Highest Priority)
   - Can exceed slot capacity (elastic capacity)
   - Never rejected due to slot being full
   - Designed for critical medical situations

2. **FOLLOW_UP**
   - Standard capacity constraints
   - Tracked separately for analytics
   - Could be prioritized in future versions

3. **ONLINE**
   - Pre-scheduled appointments
   - Subject to capacity limits
   - First-come, first-served within capacity

4. **WALK_IN** (Lowest Priority)
   - Same capacity rules as ONLINE
   - Processed in arrival order
   - Rejected when slot is full

### Design Decisions & Trade-offs

####  Advantages

**1. Simplicity & Clarity**
- Easy to understand and implement
- Clear capacity rules reduce confusion
- Predictable behavior for patients and staff

**2. Transaction Safety**
- MongoDB transactions ensure data consistency
- Atomic slot count updates prevent race conditions
- Rollback support on errors

**3. Elastic Capacity for Emergencies**
- Medical emergencies never turned away
- Accommodates unpredictable emergency load
- Balances patient safety with resource management

**4. Fair Allocation**
- First-come, first-served within each type
- No complex queue management needed
- Transparent booking process

####  Trade-offs & Limitations

**1. No Intra-Type Prioritization**
- **Current**: All WALK_IN tokens treated equally
- **Trade-off**: Cannot prioritize within same token type
- **Impact**: Senior citizens, pregnant women, etc. not prioritized
- **Future Solution**: Add priority score field within each type

**2. Limited Wait Time Optimization**
- **Current**: Slots filled in request order
- **Trade-off**: No intelligent slot allocation based on wait time
- **Impact**: Some patients may wait longer than necessary
- **Future Solution**: Implement queue position tracking and estimation

**3. Emergency Overbooking Risk**
- **Current**: Emergency tokens can exceed capacity indefinitely
- **Trade-off**: Could lead to extreme overcrowding
- **Impact**: Degraded service quality for all patients
- **Future Solution**: Set soft limits (e.g., 150% capacity) with alerts

**4. No Load Balancing Across Slots**
- **Current**: Patients pick specific slots
- **Trade-off**: Popular slots fill quickly, adjacent slots remain empty
- **Impact**: Uneven distribution, longer overall wait times
- **Future Solution**: Suggest alternative nearby slots when full

**5. Static Capacity Per Slot**
- **Current**: Fixed maxCapacity (e.g., 10) per slot
- **Trade-off**: Cannot adapt to varying demand patterns
- **Impact**: Inefficient resource utilization during off-peak hours
- **Future Solution**: Dynamic capacity based on historical patterns

**6. Cancellation Handling**
- **Current**: Immediate slot release, no penalty or rescheduling
- **Trade-off**: Potential for gaming the system
- **Impact**: Last-minute cancellations waste slot capacity
- **Future Solution**: Cancellation fees, rescheduling options, waitlist

### Scalability Considerations

**Concurrent Booking Handling**
- MongoDB transactions prevent double-booking
- Optimistic concurrency control via Mongoose
- May need distributed locking for very high concurrency (>1000 req/s)

**Database Performance**
- Indexed queries on doctorId, slotId, status
- Compound indexes for common query patterns
- Large token history may need archival strategy

**API Rate Limiting**
- Currently no rate limiting implemented
- Risk: API abuse or DDoS vulnerability
- Solution: Add rate limiting middleware (e.g., express-rate-limit)

### Recommended Production Enhancements

1. **Priority Scoring System**
   - Add `priorityScore` field to tokens
   - Consider: age, medical urgency, wait time, visit frequency
   - Process tokens in priority order within each slot

2. **Waitlist Mechanism**
   - Maintain waitlist when slots are full
   - o-promote when cancellations occur
   - SMS/email notifications for slot availability

3. **Slot Recommendation Engine**
   - Suggest alternative time slots when preferred slot is full
   - Consider: doctor availability, patient history, travel time

4. **Analytics Dashboard**
   - Track: booking patterns, cancellation rates, wait times
   - Identify: peak hours, underutilized slots, bottlenecks
   - Optimize: capacity allocation, staffing levels

5. **Multi-Tenancy Support**
   - Support multiple hospitals/clinics
   - Tenant isolation for data security
   - Configurable capacity rules per tenant

## Future Enhancements

The following enhancements are planned for future releases:

**Queue Management**
- Priority queue implementation
- Advanced emergency token handling
- Queue position tracking
- Wait time calculation and estimation

**Scheduling Improvements**
- Follow-up appointment scheduling logic
- Slot recommendation engine
- Load balancing across time slots

**Capacity Optimization**
- Dynamic capacity adjustment
- Peak hours detection and analytics
- Auto-scaling slot capacity based on demand
- Historical pattern analysis

**System Improvements**
- Performance optimization and caching
- API rate limiting and throttling
- Multi-tenancy support
- Real-time notifications (SMS/Email)
- Analytics dashboard
- Reporting and insights