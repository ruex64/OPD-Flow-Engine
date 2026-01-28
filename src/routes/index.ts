import { Router } from 'express';
import healthRoutes from './health.routes';

const router = Router();

// Health check route
router.use('/health', healthRoutes);

// Future routes will be added here
// router.use('/api/v1/tokens', tokenRoutes);
// router.use('/api/v1/queue', queueRoutes);

export default router;
