import { Request, Response } from 'express';
import { z } from 'zod';
import { TokenService } from '../services/token.service';
import { TokenType } from '../models/token.model';
import Slot from '../models/slot.model';
import Doctor from '../models/doctor.model';
import mongoose from 'mongoose';
import logger from '../utils/logger';

// Validation schemas
const bookTokenSchema = z.object({
  patientName: z.string().min(2, 'Patient name must be at least 2 characters').max(100),
  patientType: z.enum([TokenType.ONLINE, TokenType.WALK_IN, TokenType.EMERGENCY, TokenType.FOLLOW_UP], {
    message: 'Invalid patient type. Must be one of: ONLINE, WALK_IN, EMERGENCY, FOLLOW_UP'
  }),
  slotId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid slot ID format'),
});

const cancelTokenSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid token ID format'),
});

const getDoctorSlotsSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid doctor ID format'),
});

export class TokenController {
  private tokenService: TokenService;

  constructor() {
    this.tokenService = new TokenService();
  }

  /**
   * Book a new token
   * POST /api/book
   * Body: { patientName, patientType, slotId }
   */
  bookToken = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request body
      const validatedData = bookTokenSchema.parse(req.body);
      const { patientName, patientType, slotId } = validatedData;

      // Verify slot exists before attempting to book
      const slot = await Slot.findById(slotId);
      if (!slot) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Slot not found. Please provide a valid slot ID.',
          },
        });
        return;
      }

      // Book the token using TokenService
      const result = await this.tokenService.bookToken({
        doctorId: slot.doctorId.toString(),
        slotTime: slot.startTime,
        patientName,
        type: patientType as TokenType,
      });

      res.status(201).json(result);
    } catch (error: any) {
      logger.error('Error in bookToken controller:', error);

      // Handle validation errors
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation error',
            details: error.issues.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        });
        return;
      }

      // Handle application errors with appropriate status codes
      const statusCode = error.statusCode || 500;
      
      // Map specific error messages to appropriate HTTP codes
      if (error.message?.includes('Slot is full')) {
        res.status(409).json({
          success: false,
          error: {
            message: error.message,
          },
        });
        return;
      }

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
   * POST /api/cancel/:id
   */
  cancelToken = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request params
      const validatedParams = cancelTokenSchema.parse(req.params);
      const { id } = validatedParams;

      const result = await this.tokenService.cancelToken(id);

      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Error in cancelToken controller:', error);

      // Handle validation errors
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation error',
            details: error.issues.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        });
        return;
      }

      // Handle application errors
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
   * Get slots for a doctor with availability status
   * GET /api/doctors/:id/slots
   */
  getDoctorSlots = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request params
      const validatedParams = getDoctorSlotsSchema.parse(req.params);
      const { id: doctorId } = validatedParams;

      // Verify doctor exists
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        res.status(404).json({
          success: false,
          error: {
            message: 'Doctor not found',
          },
        });
        return;
      }

      // Get all slots for the doctor
      const slots = await Slot.find({
        doctorId: new mongoose.Types.ObjectId(doctorId),
      }).sort({ startTime: 1 });

      // Map slots to include availability status
      const slotsWithAvailability = slots.map((slot) => ({
        id: slot._id.toString(),
        doctorId: slot.doctorId.toString(),
        startTime: slot.startTime,
        endTime: slot.endTime,
        maxCapacity: slot.maxCapacity,
        currentCount: slot.currentCount,
        remainingSlots: Math.max(0, slot.maxCapacity - slot.currentCount),
        isAvailable: slot.currentCount < slot.maxCapacity,
        status: slot.currentCount >= slot.maxCapacity ? 'FULL' : 'AVAILABLE',
      }));

      res.status(200).json({
        success: true,
        data: {
          doctor: {
            id: doctor._id.toString(),
            name: doctor.name,
            specialization: doctor.specialization,
          },
          slots: slotsWithAvailability,
          totalSlots: slotsWithAvailability.length,
          availableSlots: slotsWithAvailability.filter((s) => s.isAvailable).length,
        },
      });
    } catch (error: any) {
      logger.error('Error in getDoctorSlots controller:', error);

      // Handle validation errors
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation error',
            details: error.issues.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        });
        return;
      }

      // Handle application errors
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: {
          message: error.message || 'Failed to get doctor slots',
        },
      });
    }
  };
}
