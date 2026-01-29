import { Router } from 'express';
import { TokenController } from '../controllers/tokenController';

const router = Router();
const tokenController = new TokenController();

/**
 * POST /api/book
 * Book a new token for a patient
 * Body: { patientName: string, patientType: TokenType, slotId: string }
 */
router.post('/book', tokenController.bookToken);

/**
 * POST /api/cancel/:id
 * Cancel a token by ID
 * Params: { id: string }
 */
router.post('/cancel/:id', tokenController.cancelToken);

/**
 * GET /api/doctors/:id/slots
 * Get all slots for a doctor with availability status
 * Params: { id: string (doctorId) }
 */
router.get('/doctors/:id/slots', tokenController.getDoctorSlots);

export default router;
