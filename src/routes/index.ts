import { Router } from 'express';
import healthRoutes from './health.routes';
import tokenRoutes from './token.routes';
import apiRoutes from './api';

const router = Router();

// Health check route
router.use('/health', healthRoutes);

// Legacy token routes (keeping for backward compatibility)
router.use('/api/tokens', tokenRoutes);

// New API routes for Phase 4
router.use('/api', apiRoutes);

// Future routes will be added here
// router.use('/api/doctors', doctorRoutes);
// router.use('/api/slots', slotRoutes);

export default router;
