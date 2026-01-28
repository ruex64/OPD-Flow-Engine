import { Router } from 'express';
import healthRoutes from './health.routes';
import tokenRoutes from './token.routes';

const router = Router();

// Health check route
router.use('/health', healthRoutes);

// API routes
router.use('/api/tokens', tokenRoutes);

// Future routes will be added here
// router.use('/api/doctors', doctorRoutes);
// router.use('/api/slots', slotRoutes);

export default router;
