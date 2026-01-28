import mongoose, { Document, Schema, Types } from 'mongoose';

export enum TokenType {
  ONLINE = 'ONLINE',
  WALK_IN = 'WALK_IN',
  EMERGENCY = 'EMERGENCY',
  FOLLOW_UP = 'FOLLOW_UP',
}

export enum TokenStatus {
  BOOKED = 'BOOKED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}

export interface IToken extends Document {
  slotId: Types.ObjectId;
  patientName: string;
  type: TokenType;
  status: TokenStatus;
  requestTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TokenSchema: Schema = new Schema(
  {
    slotId: {
      type: Schema.Types.ObjectId,
      ref: 'Slot',
      required: [true, 'Slot ID is required'],
      index: true,
    },
    patientName: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
      minlength: [2, 'Patient name must be at least 2 characters long'],
      maxlength: [100, 'Patient name cannot exceed 100 characters'],
    },
    type: {
      type: String,
      enum: {
        values: Object.values(TokenType),
        message: '{VALUE} is not a valid token type',
      },
      required: [true, 'Token type is required'],
      default: TokenType.WALK_IN,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(TokenStatus),
        message: '{VALUE} is not a valid token status',
      },
      required: [true, 'Token status is required'],
      default: TokenStatus.BOOKED,
    },
    requestTime: {
      type: Date,
      required: [true, 'Request time is required'],
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for efficient queries
TokenSchema.index({ slotId: 1, status: 1 });
TokenSchema.index({ patientName: 1 });
TokenSchema.index({ requestTime: 1 });
TokenSchema.index({ type: 1, status: 1 });

export default mongoose.model<IToken>('Token', TokenSchema);
