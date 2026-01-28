import { Router } from 'express';
import { TokenController } from '../controllers/token.controller';

const router = Router();
const tokenController = new TokenController();

// Book a new token
router.post('/book', tokenController.bookToken);

// Get token by ID
router.get('/:id', tokenController.getToken);

// Cancel a token
router.patch('/:id/cancel', tokenController.cancelToken);

// Get tokens by slot
router.get('/slot/:slotId', tokenController.getTokensBySlot);

// Get tokens by patient name
router.get('/patient/:patientName', tokenController.getTokensByPatient);

export default router;
