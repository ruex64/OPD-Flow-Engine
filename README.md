# OPD Flow Engine

OPD Token Allocation System with elastic capacity management, prioritization logic, and API endpoints.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Logger**: Winston
- **Security**: Helmet, CORS

## Architecture

This project follows a clean **Service-Layer Architecture** with separation of concerns:

```
Controller -> Service -> Data Access
```

## Project Structure

```
src/
├── app.ts              # Express app configuration and middleware
├── server.ts           # Server entry point
├── controllers/        # Request handlers
├── services/           # Business logic layer
├── routes/             # API route definitions
├── middleware/         # Custom middleware (error handlers, validators)
└── utils/              # Utility functions (logger, helpers)
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your configuration

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

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run start:dev` - Start development server without nodemon
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors

### Health Check

Once the server is running, you can check the health status:

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "success": true,
  "message": "OPD Flow Engine is running",
  "timestamp": "2026-01-28T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "development"
}
```

## Phase 1: Foundation ✅

- [x] Project initialization
- [x] TypeScript configuration
- [x] Service-layer architecture setup
- [x] Express app configuration
- [x] Middleware setup (Helmet, CORS, Error handling)
- [x] Logger implementation (Winston)
- [x] Health check endpoint

## Next Phases

- **Phase 2**: Token allocation logic
- **Phase 3**: Queue management and prioritization
- **Phase 4**: Elastic capacity management
- **Phase 5**: API endpoints for token operations

## License

ISC
