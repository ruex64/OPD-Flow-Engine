import mongoose from 'mongoose';
import Token, { TokenType, TokenStatus, IToken } from '../models/token.model';
import Slot from '../models/slot.model';
import Doctor from '../models/doctor.model';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

export interface BookTokenRequest {
  doctorId: string;
  slotTime: Date;
  patientName: string;
  type: TokenType;
}

export interface BookTokenResponse {
  success: boolean;
  message: string;
  token: {
    id: string;
    slotId: string;
    patientName: string;
    type: TokenType;
    status: TokenStatus;
    requestTime: Date;
  };
  slot: {
    doctorId: string;
    startTime: Date;
    endTime: Date;
    currentCount: number;
    maxCapacity: number;
    remainingSlots: number;
  };
}

export interface CancelTokenResponse {
  success: boolean;
  message: string;
  token: {
    id: string;
    status: TokenStatus;
  };
}

export class TokenService {
  /**
   * Book a token for a patient
   * @param bookingRequest - Booking details
   * @returns BookTokenResponse
   */
  async bookToken(bookingRequest: BookTokenRequest): Promise<BookTokenResponse> {
    const { doctorId, slotTime, patientName, type } = bookingRequest;

    // Validate inputs
    if (!doctorId || !slotTime || !patientName || !type) {
      throw new AppError('Missing required fields', 400);
    }

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      throw new AppError('Invalid doctor ID', 400);
    }

    if (!Object.values(TokenType).includes(type)) {
      throw new AppError('Invalid token type', 400);
    }

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Step 1: Find the correct Slot for the doctor and time
      logger.info(`Finding slot for doctor ${doctorId} at ${slotTime}`);

      // Verify doctor exists
      const doctor = await Doctor.findById(doctorId).session(session);
      if (!doctor) {
        throw new AppError('Doctor not found', 404);
      }

      // Find the slot that matches the doctor and time range
      const requestedTime = new Date(slotTime);
      const slot = await Slot.findOne({
        doctorId: new mongoose.Types.ObjectId(doctorId),
        startTime: { $lte: requestedTime },
        endTime: { $gt: requestedTime },
      }).session(session);

      if (!slot) {
        throw new AppError(
          `No slot found for doctor ${doctor.name} at ${requestedTime.toLocaleTimeString()}`,
          404
        );
      }

      logger.info(
        `Found slot: ${slot.startTime.toLocaleTimeString()} - ${slot.endTime.toLocaleTimeString()}, ` +
          `Current: ${slot.currentCount}/${slot.maxCapacity}`
      );

      // Step 2: Capacity Check
      const isSlotFull = slot.currentCount >= slot.maxCapacity;
      const isEmergency = type === TokenType.EMERGENCY;

      if (isSlotFull && !isEmergency) {
        throw new AppError(
          `Slot is full. Current capacity: ${slot.currentCount}/${slot.maxCapacity}`,
          409
        );
      }

      if (isSlotFull && isEmergency) {
        logger.warn(
          `Emergency booking exceeding capacity: ${slot.currentCount + 1}/${slot.maxCapacity}`
        );
      }

      // Step 3: Create a new Token document
      const token = new Token({
        slotId: slot._id,
        patientName: patientName.trim(),
        type,
        status: TokenStatus.BOOKED,
        requestTime: new Date(),
      });

      await token.save({ session });

      // Step 4: Update the Slot document (increment currentCount)
      slot.currentCount += 1;
      await slot.save({ session });

      // Commit the transaction
      await session.commitTransaction();

      logger.info(
        `Token booked successfully for ${patientName} (${type}) in slot ${slot._id}`
      );

      return {
        success: true,
        message: isEmergency && isSlotFull
          ? 'Emergency token booked (exceeding normal capacity)'
          : 'Token booked successfully',
        token: {
          id: token._id.toString(),
          slotId: slot._id.toString(),
          patientName: token.patientName,
          type: token.type,
          status: token.status,
          requestTime: token.requestTime,
        },
        slot: {
          doctorId: slot.doctorId.toString(),
          startTime: slot.startTime,
          endTime: slot.endTime,
          currentCount: slot.currentCount,
          maxCapacity: slot.maxCapacity,
          remainingSlots: Math.max(0, slot.maxCapacity - slot.currentCount),
        },
      };
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      
      if (error instanceof AppError) {
        throw error;
      }
      
      logger.error('Error booking token:', error);
      throw new AppError('Failed to book token', 500);
    } finally {
      session.endSession();
    }
  }

  /**
   * Cancel a token
   * @param tokenId - ID of the token to cancel
   * @returns CancelTokenResponse
   */
  async cancelToken(tokenId: string): Promise<CancelTokenResponse> {
    // Validate input
    if (!tokenId) {
      throw new AppError('Token ID is required', 400);
    }

    if (!mongoose.Types.ObjectId.isValid(tokenId)) {
      throw new AppError('Invalid token ID', 400);
    }

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find the Token by ID
      logger.info(`Cancelling token ${tokenId}`);

      const token = await Token.findById(tokenId).session(session);

      if (!token) {
        throw new AppError('Token not found', 404);
      }

      // Check if token is already cancelled
      if (token.status === TokenStatus.CANCELLED) {
        throw new AppError('Token is already cancelled', 400);
      }

      // Check if token is completed
      if (token.status === TokenStatus.COMPLETED) {
        throw new AppError('Cannot cancel a completed token', 400);
      }

      // Update Token status to CANCELLED
      token.status = TokenStatus.CANCELLED;
      await token.save({ session });

      // Find the associated Slot and decrement currentCount
      const slot = await Slot.findById(token.slotId).session(session);

      if (!slot) {
        throw new AppError('Associated slot not found', 404);
      }

      // Decrement currentCount (ensure it doesn't go below 0)
      if (slot.currentCount > 0) {
        slot.currentCount -= 1;
        await slot.save({ session });
      } else {
        logger.warn(`Slot ${slot._id} already has currentCount of 0, cannot decrement`);
      }

      // Commit the transaction
      await session.commitTransaction();

      logger.info(
        `Token ${tokenId} cancelled successfully. Slot ${slot._id} count: ${slot.currentCount}`
      );

      return {
        success: true,
        message: 'Token cancelled successfully',
        token: {
          id: token._id.toString(),
          status: token.status,
        },
      };
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      
      if (error instanceof AppError) {
        throw error;
      }
      
      logger.error('Error cancelling token:', error);
      throw new AppError('Failed to cancel token', 500);
    } finally {
      session.endSession();
    }
  }

  /**
   * Get token details by ID
   * @param tokenId - ID of the token
   * @returns Token with populated slot and doctor information
   */
  async getTokenById(tokenId: string): Promise<IToken | null> {
    if (!tokenId || !mongoose.Types.ObjectId.isValid(tokenId)) {
      throw new AppError('Invalid token ID', 400);
    }

    const token = await Token.findById(tokenId)
      .populate({
        path: 'slotId',
        populate: {
          path: 'doctorId',
          model: 'Doctor',
        },
      })
      .exec();

    if (!token) {
      throw new AppError('Token not found', 404);
    }

    return token;
  }

  /**
   * Get all tokens for a specific slot
   * @param slotId - ID of the slot
   * @returns Array of tokens
   */
  async getTokensBySlot(slotId: string): Promise<IToken[]> {
    if (!slotId || !mongoose.Types.ObjectId.isValid(slotId)) {
      throw new AppError('Invalid slot ID', 400);
    }

    return await Token.find({ slotId, status: { $ne: TokenStatus.CANCELLED } })
      .sort({ requestTime: 1 })
      .exec();
  }

  /**
   * Get all tokens for a patient
   * @param patientName - Name of the patient
   * @returns Array of tokens
   */
  async getTokensByPatient(patientName: string): Promise<IToken[]> {
    if (!patientName || patientName.trim().length === 0) {
      throw new AppError('Patient name is required', 400);
    }

    return await Token.find({ patientName: new RegExp(patientName, 'i') })
      .populate({
        path: 'slotId',
        populate: {
          path: 'doctorId',
          model: 'Doctor',
        },
      })
      .sort({ requestTime: -1 })
      .exec();
  }
}
