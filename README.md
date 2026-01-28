# OPD Flow Engine

OPD Token Allocation System with elastic capacity management, prioritization logic, and API endpoints.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Database Setup](#database-setup)
- [API Documentation](#api-documentation)
- [Development Guide](#development-guide)
- [Project Phases](#project-phases)

## Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
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
│   │   └── health.controller.ts  # Health check controller
│   ├── services/
│   │   └── health.service.ts     # Health check service
│   ├── routes/
│   │   ├── index.ts              # Route aggregator
│   │   └── health.routes.ts      # Health check routes
│   ├── middleware/
│   │   └── errorHandler.ts       # Global error handler
│   ├── models/
│   │   ├── doctor.model.ts       # Doctor schema and interface
│   │   ├── slot.model.ts         # Slot schema and interface
│   │   └── token.model.ts        # Token schema and interface
│   └── utils/
│       └── logger.ts             # Winston logger configuration
├── scripts/
│   └── seed.ts                   # Database seeding script
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
   NODE_ENV=development
   PORT=3000
   LOG_LEVEL=info
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
- `npm run lint` - Run ESLint to check code quality
- `npm run lint:fix` - Automatically fix ESLint errors

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

## Development Guide

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Application environment | `development` |
| `PORT` | Server port number | `3000` |
| `LOG_LEVEL` | Winston log level (error, warn, info, debug) | `info` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/opd-flow-engine` |
| `CORS_ORIGIN` | Allowed CORS origins | `*` |

### Logging

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

## Project Phases

### Phase 1: Foundation (Completed)

- [x] Project initialization with TypeScript
- [x] Service-layer architecture setup
- [x] Express app configuration
- [x] Middleware setup (Helmet, CORS, JSON parsing)
- [x] Global error handling
- [x] Winston logger implementation
- [x] Health check endpoint

### Phase 2: Data Modeling (Completed)

- [x] MongoDB connection setup
- [x] Mongoose schemas with TypeScript interfaces
- [x] Doctor model implementation
- [x] Slot model implementation
- [x] Token model implementation
- [x] Database seeding script
- [x] Data validation and indexes

### Phase 3: Token Allocation API (In Progress)

- [ ] Doctor CRUD endpoints
- [ ] Slot management endpoints
- [ ] Token booking endpoints
- [ ] Token cancellation logic
- [ ] Slot availability checking

### Phase 4: Queue Management and Prioritization

- [ ] Priority queue implementation
- [ ] Emergency token handling
- [ ] Follow-up appointment logic
- [ ] Wait time calculation
- [ ] Queue position tracking

### Phase 5: Elastic Capacity Management

- [ ] Dynamic capacity adjustment
- [ ] Peak hours detection
- [ ] Auto-scaling slot capacity
- [ ] Analytics and reporting
- [ ] Performance optimization

## License

ISC
