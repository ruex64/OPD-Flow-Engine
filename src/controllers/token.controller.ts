import { Request, Response } from 'express';
import { TokenService } from '../services/token.service';
import { TokenType } from '../models/token.model';
import logger from '../utils/logger';

export class TokenController {
  private tokenService: TokenService;

  constructor() {
    this.tokenService = new TokenService();
  }

  /**
   * Book a new token
   * POST /api/tokens/book
   */
  bookToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { doctorId, slotTime, patientName, type } = req.body;

      const result = await this.tokenService.bookToken({
        doctorId,
        slotTime: new Date(slotTime),
        patientName,
        type: type as TokenType,
      });

      res.status(201).json(result);
    } catch (error: any) {
      logger.error('Error in bookToken controller:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: {
          message: error.message || 'Failed to book token',
        },
      });
    }
  };

  /**
   * Cancel a token
   * PATCH /api/tokens/:id/cancel
   */
  cancelToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const result = await this.tokenService.cancelToken(id);

      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Error in cancelToken controller:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: {
          message: error.message || 'Failed to cancel token',
        },
      });
    }
  };

  /**
   * Get token by ID
   * GET /api/tokens/:id
   */
  getToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const token = await this.tokenService.getTokenById(id);

      res.status(200).json({
        success: true,
        data: token,
      });
    } catch (error: any) {
      logger.error('Error in getToken controller:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: {
          message: error.message || 'Failed to get token',
        },
      });
    }
  };

  /**
   * Get tokens by slot ID
   * GET /api/tokens/slot/:slotId
   */
  getTokensBySlot = async (req: Request, res: Response): Promise<void> => {
    try {
      const { slotId } = req.params;

      const tokens = await this.tokenService.getTokensBySlot(slotId);

      res.status(200).json({
        success: true,
        count: tokens.length,
        data: tokens,
      });
    } catch (error: any) {
      logger.error('Error in getTokensBySlot controller:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: {
          message: error.message || 'Failed to get tokens',
        },
      });
    }
  };

  /**
   * Get tokens by patient name
   * GET /api/tokens/patient/:patientName
   */
  getTokensByPatient = async (req: Request, res: Response): Promise<void> => {
    try {
      const { patientName } = req.params;

      const tokens = await this.tokenService.getTokensByPatient(patientName);

      res.status(200).json({
        success: true,
        count: tokens.length,
        data: tokens,
      });
    } catch (error: any) {
      logger.error('Error in getTokensByPatient controller:', error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: {
          message: error.message || 'Failed to get tokens',
        },
      });
    }
  };
}
